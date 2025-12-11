# Script to fix GitHub Actions deployment to Azure Web App
# This configures the Web App properly and regenerates the publish profile

param(
    [string]$AppName = "xbox-clips-gallery",
    [string]$ResourceGroup = "xbox-clips-rg"
)

Write-Host "=== Fixing Azure Web App Deployment Configuration ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Configure Basic Authentication (required for publish profile)
Write-Host "Step 1: Enabling Basic Authentication for SCM..." -ForegroundColor Yellow
az webapp config set `
    --name $AppName `
    --resource-group $ResourceGroup `
    --ftps-state Disabled

az resource update `
    --resource-group $ResourceGroup `
    --name scm `
    --resource-type basicPublishingCredentialsPolicies `
    --parent sites/$AppName `
    --set properties.allow=true

Write-Host "✓ Basic Authentication enabled" -ForegroundColor Green
Write-Host ""

# Step 2: Configure deployment settings
Write-Host "Step 2: Configuring deployment settings..." -ForegroundColor Yellow
az webapp config appsettings set `
    --name $AppName `
    --resource-group $ResourceGroup `
    --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true `
               WEBSITE_NODE_DEFAULT_VERSION="20-lts" `
               > $null

Write-Host "✓ Deployment settings configured" -ForegroundColor Green
Write-Host ""

# Step 3: Restart the web app to apply changes
Write-Host "Step 3: Restarting web app..." -ForegroundColor Yellow
az webapp restart --name $AppName --resource-group $ResourceGroup
Write-Host "✓ Web app restarted" -ForegroundColor Green
Write-Host ""

# Step 4: Wait a moment for the app to fully restart
Write-Host "Waiting for web app to fully restart..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 5: Get fresh publish profile
Write-Host "Step 4: Generating fresh publish profile..." -ForegroundColor Yellow
$publishProfile = az webapp deployment list-publishing-profiles `
    --name $AppName `
    --resource-group $ResourceGroup `
    --xml

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to get publish profile" -ForegroundColor Red
    exit 1
}

# Save to file
$outputFile = "publish-profile-fixed.xml"
$publishProfile | Out-File -FilePath $outputFile -Encoding utf8 -NoNewline

Write-Host "✓ Fresh publish profile generated" -ForegroundColor Green
Write-Host ""

# Verify the profile contains the app name
if ($publishProfile -match $AppName) {
    Write-Host "✓ Verified: Publish profile contains correct app name" -ForegroundColor Green
} else {
    Write-Host "⚠ WARNING: App name not found in publish profile" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================== CONFIGURATION COMPLETE ====================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your Azure Web App has been reconfigured for GitHub Actions deployment." -ForegroundColor White
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open the file: $outputFile" -ForegroundColor White
Write-Host "2. Copy ALL contents (entire XML)" -ForegroundColor White
Write-Host "3. Go to GitHub: Settings → Secrets and variables → Actions" -ForegroundColor White
Write-Host "4. DELETE the old 'AZURE_WEBAPP_PUBLISH_PROFILE' secret if it exists" -ForegroundColor Red
Write-Host "5. Create NEW secret:" -ForegroundColor White
Write-Host "   Name: AZURE_WEBAPP_PUBLISH_PROFILE" -ForegroundColor Yellow
Write-Host "   Value: [Paste the complete XML]" -ForegroundColor White
Write-Host "6. Push code to trigger deployment:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Trigger deployment'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# Show verification info
Write-Host "App Configuration:" -ForegroundColor Cyan
az webapp show --name $AppName --resource-group $ResourceGroup --query "{Name:name, State:state, URL:defaultHostName}" --output table
