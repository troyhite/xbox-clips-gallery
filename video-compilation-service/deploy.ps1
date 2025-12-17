# Video Compilation Microservice Deployment Script
# Deploys a lightweight FFmpeg service to Azure Container Apps

param(
    [string]$ResourceGroup = "xbox-clips-rg",
    [string]$Location = "centralus",
    [string]$ContainerRegistry = "xboxclipsregistry",
    [string]$ContainerAppName = "video-compilation-service",
    [string]$ContainerAppEnv = "xbox-clips-env",
    [string]$ImageName = "video-compilation-service",
    [string]$ImageTag = "latest",
    [string]$StorageAccountName = "galleryclipsvi"
)

$ErrorActionPreference = "Stop"

Write-Host "`n🎬 Video Compilation Microservice Deployment" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Step 1: Check/Create Azure Container Registry
Write-Host "📦 Step 1: Checking Azure Container Registry..." -ForegroundColor Yellow
$acrExists = az acr show --name $ContainerRegistry --resource-group $ResourceGroup 2>$null
if (-not $acrExists) {
    Write-Host "Creating new registry: $ContainerRegistry" -ForegroundColor Gray
    az acr create `
        --resource-group $ResourceGroup `
        --name $ContainerRegistry `
        --sku Basic `
        --location $Location `
        --admin-enabled true
} else {
    Write-Host "✓ Registry exists: $ContainerRegistry" -ForegroundColor Green
}

# Step 2: Build and push Docker image
Write-Host "`n🔨 Step 2: Building microservice Docker image..." -ForegroundColor Yellow
az acr login --name $ContainerRegistry

$fullImageName = "$ContainerRegistry.azurecr.io/${ImageName}:${ImageTag}"
Write-Host "Building: $fullImageName" -ForegroundColor Gray

az acr build `
    --registry $ContainerRegistry `
    --image "${ImageName}:${ImageTag}" `
    --file Dockerfile `
    .

Write-Host "✓ Image built and pushed" -ForegroundColor Green

# Step 3: Check/Create Container Apps Environment
Write-Host "`n🌍 Step 3: Checking Container Apps Environment..." -ForegroundColor Yellow
$envExists = az containerapp env show --name $ContainerAppEnv --resource-group $ResourceGroup 2>$null
if (-not $envExists) {
    Write-Host "Creating environment: $ContainerAppEnv" -ForegroundColor Gray
    az containerapp env create `
        --name $ContainerAppEnv `
        --resource-group $ResourceGroup `
        --location $Location
} else {
    Write-Host "✓ Environment exists: $ContainerAppEnv" -ForegroundColor Green
}

# Step 4: Get ACR credentials
Write-Host "`n🔑 Step 4: Getting ACR credentials..." -ForegroundColor Yellow
$acrServer = az acr show --name $ContainerRegistry --query loginServer -o tsv
$acrUsername = az acr credential show --name $ContainerRegistry --query username -o tsv
$acrPassword = az acr credential show --name $ContainerRegistry --query "passwords[0].value" -o tsv

# Step 5: Deploy Container App
Write-Host "`n🚢 Step 5: Deploying microservice..." -ForegroundColor Yellow
$appExists = az containerapp show --name $ContainerAppName --resource-group $ResourceGroup 2>$null

if (-not $appExists) {
    Write-Host "Creating container app: $ContainerAppName" -ForegroundColor Gray
    az containerapp create `
        --name $ContainerAppName `
        --resource-group $ResourceGroup `
        --environment $ContainerAppEnv `
        --image $fullImageName `
        --target-port 8080 `
        --ingress external `
        --registry-server $acrServer `
        --registry-username $acrUsername `
        --registry-password $acrPassword `
        --cpu 2.0 `
        --memory 4.0Gi `
        --min-replicas 0 `
        --max-replicas 5 `
        --system-assigned `
        --env-vars "AZURE_STORAGE_ACCOUNT_NAME=$StorageAccountName"
} else {
    Write-Host "Updating container app: $ContainerAppName" -ForegroundColor Gray
    az containerapp update `
        --name $ContainerAppName `
        --resource-group $ResourceGroup `
        --image $fullImageName
}

Write-Host "✓ Microservice deployed" -ForegroundColor Green

# Step 6: Configure Managed Identity & Permissions
Write-Host "`n🔐 Step 6: Configuring permissions..." -ForegroundColor Yellow
$principalId = az containerapp show `
    --name $ContainerAppName `
    --resource-group $ResourceGroup `
    --query identity.principalId `
    -o tsv

Write-Host "Managed Identity: $principalId" -ForegroundColor Gray

$storageScope = "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$ResourceGroup/providers/Microsoft.Storage/storageAccounts/$StorageAccountName"

az role assignment create `
    --assignee $principalId `
    --role "Storage Blob Data Contributor" `
    --scope $storageScope `
    2>$null

Write-Host "✓ Storage permissions assigned" -ForegroundColor Green

# Step 7: Get service URL
Write-Host "`n📡 Step 7: Getting service URL..." -ForegroundColor Yellow
$serviceUrl = az containerapp show `
    --name $ContainerAppName `
    --resource-group $ResourceGroup `
    --query properties.configuration.ingress.fqdn `
    -o tsv

Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "============================`n" -ForegroundColor Green
Write-Host "Service URL: https://$serviceUrl" -ForegroundColor Cyan
Write-Host "Health Check: https://$serviceUrl/health" -ForegroundColor Cyan
Write-Host "Compilation Endpoint: https://$serviceUrl/compile" -ForegroundColor Cyan
Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Add this URL to your Web App environment variables:" -ForegroundColor Gray
Write-Host "   VIDEO_COMPILATION_SERVICE_URL=https://$serviceUrl" -ForegroundColor Cyan
Write-Host "2. Test the health endpoint in your browser" -ForegroundColor Gray
Write-Host "3. Update your Web App to call this service" -ForegroundColor Gray
Write-Host "`n💡 View logs:" -ForegroundColor Yellow
Write-Host "   az containerapp logs show --name $ContainerAppName --resource-group $ResourceGroup --follow" -ForegroundColor Gray
Write-Host ""
