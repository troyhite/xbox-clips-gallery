# Script to get Azure Web App publish profile for GitHub Actions
# Run this in PowerShell to get your publish profile correctly formatted

param(
    [string]$AppName = "xbox-clips-gallery",
    [string]$ResourceGroup = "xbox-clips-rg"
)

Write-Host "Getting publish profile for: $AppName" -ForegroundColor Cyan
Write-Host "Resource group: $ResourceGroup" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
$azInstalled = Get-Command az -ErrorAction SilentlyContinue
if (-not $azInstalled) {
    Write-Host "ERROR: Azure CLI is not installed!" -ForegroundColor Red
    Write-Host "Install from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
$account = az account show 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not logged in to Azure CLI" -ForegroundColor Red
    Write-Host "Run: az login" -ForegroundColor Yellow
    exit 1
}

# Verify the web app exists
Write-Host "Verifying web app exists..." -ForegroundColor Yellow
$appExists = az webapp show --name $AppName --resource-group $ResourceGroup 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Web app '$AppName' not found in resource group '$ResourceGroup'" -ForegroundColor Red
    Write-Host ""
    Write-Host "Available web apps in subscription:" -ForegroundColor Yellow
    az webapp list --query "[].{Name:name, ResourceGroup:resourceGroup, State:state, DefaultHostName:defaultHostName}" --output table
    exit 1
}

Write-Host "✓ Web app found!" -ForegroundColor Green
Write-Host ""

# Get the publish profile
Write-Host "Fetching publish profile..." -ForegroundColor Yellow
$publishProfile = az webapp deployment list-publishing-profiles `
    --name $AppName `
    --resource-group $ResourceGroup `
    --xml

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to get publish profile" -ForegroundColor Red
    exit 1
}

# Save to file
$outputFile = "publish-profile.xml"
$publishProfile | Out-File -FilePath $outputFile -Encoding utf8

Write-Host "✓ Publish profile saved to: $outputFile" -ForegroundColor Green
Write-Host ""
Write-Host "==================== NEXT STEPS ====================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open the file: $outputFile" -ForegroundColor White
Write-Host "2. Copy the ENTIRE contents (Ctrl+A, Ctrl+C)" -ForegroundColor White
Write-Host "3. Go to your GitHub repo → Settings → Secrets and variables → Actions" -ForegroundColor White
Write-Host "4. Click 'New repository secret'" -ForegroundColor White
Write-Host "5. Name: AZURE_WEBAPP_PUBLISH_PROFILE" -ForegroundColor Yellow
Write-Host "6. Value: Paste the XML content" -ForegroundColor White
Write-Host "7. Click 'Add secret'" -ForegroundColor White
Write-Host ""
Write-Host "Your app name in the workflow is: $AppName" -ForegroundColor Cyan
Write-Host "Make sure this matches in: .github/workflows/azure-deploy.yml" -ForegroundColor Cyan
Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan

# Display first few lines to verify
Write-Host ""
Write-Host "Preview of publish profile:" -ForegroundColor Yellow
Write-Host ($publishProfile -split "`n" | Select-Object -First 5) -ForegroundColor Gray
Write-Host "..." -ForegroundColor Gray
