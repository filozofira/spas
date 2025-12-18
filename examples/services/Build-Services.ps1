# Build all example service images for --dev mode
# Run from repository root as build context (Dockerfiles reference components/sdk/dotnet)
$repoRoot = Resolve-Path "$PSScriptRoot/../.."

docker build -t spas-examples/order-service:latest -f "$repoRoot/examples/services/order-service/Dockerfile" $repoRoot
docker build -t spas-examples/inventory-service:latest -f "$repoRoot/examples/services/inventory-service/Dockerfile" $repoRoot
docker build -t spas-examples/product-service:latest -f "$repoRoot/examples/services/product-service/Dockerfile" $repoRoot
docker build -t spas-examples/subscription-service:latest -f "$repoRoot/examples/services/subscription-service/Dockerfile" $repoRoot