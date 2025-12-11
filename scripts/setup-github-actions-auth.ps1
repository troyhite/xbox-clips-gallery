# Setup Azure Service Principal authentication for GitHub Actions
# This is the RECOMMENDED method - more reliable than publish profiles

param(
    [string]$AppName = "xbox-clips-gallery",
    [string]$ResourceGroup = "xbox-clips-rg",
    [string]$ServicePrincipalName = "github-actions-xbox-clips"
)

Write-Host "=== Setting up Azure Service Principal for GitHub Actions ===" -ForegroundColor Cyan
Write-Host ""

# Get subscription info
$subscriptionInfo = az account show | ConvertFrom-Json
$subscriptionId = $subscriptionInfo.id
$subscriptionName = $subscriptionInfo.name

Write-Host "Subscription: $subscriptionName" -ForegroundColor Yellow
Write-Host "Subscription ID: $subscriptionId" -ForegroundColor Yellow
Write-Host ""

# Get resource group ID
$rgId = "/subscriptions/$subscriptionId/resourceGroups/$ResourceGroup"

Write-Host "Creating service principal with Contributor access to resource group..." -ForegroundColor Yellow
Write-Host ""

# Create service principal with contributor role scoped to the resource group
$sp = az ad sp create-for-rbac `
    --name $ServicePrincipalName `
    --role Contributor `
    --scopes $rgId `
    --sdk-auth | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create service principal" -ForegroundColor Red
    Write-Host "If it already exists, delete it first:" -ForegroundColor Yellow
    Write-Host "az ad sp delete --id `$(az ad sp list --display-name $ServicePrincipalName --query [0].appId -o tsv)" -ForegroundColor Gray
    exit 1
}

Write-Host "✓ Service principal created successfully!" -ForegroundColor Green
Write-Host ""

# Get the web app ID for additional permissions
$webAppId = az webapp show --name $AppName --resource-group $ResourceGroup --query id -o tsv

Write-Host "Granting Website Contributor role to web app..." -ForegroundColor Yellow
az role assignment create `
    --assignee $sp.clientId `
    --role "Website Contributor" `
    --scope $webAppId `
    > $null

Write-Host "✓ Permissions granted!" -ForegroundColor Green
Write-Host ""

# Convert SP credentials to JSON for GitHub secret
$azureCredentials = @{
    clientId = $sp.clientId
    clientSecret = $sp.clientSecret
    subscriptionId = $sp.subscriptionId
    tenantId = $sp.tenantId
    resourceManagerEndpointUrl = "https://management.azure.com/"
} | ConvertTo-Json -Compress

# Save to file
$azureCredentials | Out-File -FilePath "azure-credentials.json" -Encoding utf8 -NoNewline

Write-Host "==================== CONFIGURATION COMPLETE ====================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Azure credentials saved to: azure-credentials.json" -ForegroundColor White
Write-Host ""
Write-Host "GITHUB SECRET SETUP:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Copy the contents of azure-credentials.json" -ForegroundColor White
Write-Host "2. Go to: GitHub repo → Settings → Secrets and variables → Actions" -ForegroundColor White
Write-Host "3. Create NEW secret:" -ForegroundColor White
Write-Host "   Name: AZURE_CREDENTIALS" -ForegroundColor Cyan
Write-Host "   Value: [Paste the JSON]" -ForegroundColor White
Write-Host ""
Write-Host "4. Your workflow file has been updated to use this method" -ForegroundColor White
Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Preview of credentials (DO NOT share this):" -ForegroundColor Yellow
Write-Host $azureCredentials -ForegroundColor Gray
Write-Host ""
Write-Host "Keep azure-credentials.json SECURE and add to .gitignore!" -ForegroundColor Red
