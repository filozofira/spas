FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy SDK projects
COPY ["components/sdk/dotnet/src/Spas.Sdk.Core/Spas.Sdk.Core.csproj", "components/sdk/dotnet/src/Spas.Sdk.Core/"]
COPY ["components/sdk/dotnet/src/Spas.Sdk.Metadata/Spas.Sdk.Metadata.csproj", "components/sdk/dotnet/src/Spas.Sdk.Metadata/"]
COPY ["components/sdk/dotnet/src/Spas.Sdk.Events/Spas.Sdk.Events.csproj", "components/sdk/dotnet/src/Spas.Sdk.Events/"]
COPY ["components/sdk/dotnet/src/Spas.Sdk.Observability/Spas.Sdk.Observability.csproj", "components/sdk/dotnet/src/Spas.Sdk.Observability/"]

# Copy service project
COPY ["examples/services/inventory-service/InventoryService.csproj", "examples/services/inventory-service/"]

# Restore dependencies
RUN dotnet restore "examples/services/inventory-service/InventoryService.csproj"

# Copy source
COPY ["components/sdk/dotnet/src/", "components/sdk/dotnet/src/"]
COPY ["examples/services/inventory-service/", "examples/services/inventory-service/"]

# Build
WORKDIR "/src/examples/services/inventory-service"
RUN dotnet build "InventoryService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "InventoryService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "InventoryService.dll"]
