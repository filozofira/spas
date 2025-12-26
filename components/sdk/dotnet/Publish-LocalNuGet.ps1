#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Publishes SPAS .NET SDK packages to a local NuGet feed for development.

.DESCRIPTION
    This script builds all SPAS SDK projects and publishes them to a local NuGet feed.
    It supports local development workflows where SDK packages need to be tested before
    publishing to a remote feed.

.PARAMETER Setup
    Performs initial setup: creates feed directory and builds/publishes all packages.

.PARAMETER Rebuild
    Cleans old package versions and rebuilds/republishes all packages.

.PARAMETER List
    Lists all packages currently in the local feed.

.PARAMETER Clean
    Removes all packages from the local feed.

.PARAMETER FeedPath
    Custom path for the local NuGet feed. Default: ~/.nuget/local-feed

.PARAMETER Global
    Also adds the local feed to the global NuGet configuration.

.PARAMETER Configuration
    Build configuration (Debug or Release). Default: Release

.EXAMPLE
    .\Publish-LocalNuGet.ps1 -Setup
    Performs initial setup and publishes all SDK packages.

.EXAMPLE
    .\Publish-LocalNuGet.ps1 -Rebuild
    Rebuilds and republishes all packages after SDK changes.

.EXAMPLE
    .\Publish-LocalNuGet.ps1 -List
    Lists all packages in the local feed.

.EXAMPLE
    .\Publish-LocalNuGet.ps1 -Setup -Global
    Sets up local feed and adds it to global NuGet config.
#>

[CmdletBinding(DefaultParameterSetName = 'Setup')]
param(
    [Parameter(ParameterSetName = 'Setup')]
    [switch]$Setup,

    [Parameter(ParameterSetName = 'Rebuild')]
    [switch]$Rebuild,

    [Parameter(ParameterSetName = 'List')]
    [switch]$List,

    [Parameter(ParameterSetName = 'Clean')]
    [switch]$Clean,

    [Parameter()]
    [string]$FeedPath = (Join-Path $HOME '.nuget' 'local-feed'),

    [Parameter()]
    [switch]$Global,

    [Parameter()]
    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Release'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Resolve feed path to absolute
$FeedPath = [System.IO.Path]::GetFullPath($FeedPath)

# Find SDK root directory
$SdkRoot = $PSScriptRoot
$SrcDir = Join-Path $SdkRoot 'src'

if (-not (Test-Path $SrcDir)) {
    Write-Error "SDK source directory not found: $SrcDir"
    exit 1
}

function Write-Status {
    param([string]$Message)
    Write-Host "✓ " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Write-Info {
    param([string]$Message)
    Write-Host "→ " -ForegroundColor Cyan -NoNewline
    Write-Host $Message
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Ensure-FeedDirectory {
    if (-not (Test-Path $FeedPath)) {
        New-Item -Path $FeedPath -ItemType Directory -Force | Out-Null
        Write-Status "Created local NuGet feed: $FeedPath"
    } else {
        Write-Info "Using existing feed: $FeedPath"
    }
}

function Get-SdkProjects {
    Get-ChildItem -Path $SrcDir -Filter '*.csproj' -Recurse | 
        Where-Object { $_.Directory.Name -notmatch 'obj|bin' }
}

function Build-Package {
    param(
        [System.IO.FileInfo]$ProjectFile
    )

    $projectName = $ProjectFile.Directory.Name
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $version = "1.0.0-local-$timestamp"

    Write-Info "Building $projectName ($version)..."

    $output = Join-Path $SdkRoot 'artifacts' 'packages'
    
    $buildArgs = @(
        'pack',
        $ProjectFile.FullName,
        '-c', $Configuration,
        '-o', $output,
        "/p:PackageVersion=$version",
        '--nologo',
        '-v', 'quiet'
    )

    $result = & dotnet @buildArgs 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build $projectName`: $result"
        return $null
    }

    $nupkgPattern = Join-Path $output "$projectName.$version.nupkg"
    $nupkg = Get-Item $nupkgPattern -ErrorAction SilentlyContinue

    if ($nupkg) {
        Write-Status "Built $projectName $version"
        return $nupkg
    } else {
        Write-Warning "Package file not found: $nupkgPattern"
        return $null
    }
}

function Publish-Package {
    param(
        [System.IO.FileInfo]$PackageFile
    )

    Write-Info "Publishing $($PackageFile.Name)..."

    Copy-Item -Path $PackageFile.FullName -Destination $FeedPath -Force

    Write-Status "Published $($PackageFile.Name)"
}

function Add-GlobalNuGetSource {
    Write-Info "Adding local feed to global NuGet configuration..."

    # Check if source already exists
    $sources = & dotnet nuget list source 2>&1
    if ($sources -match 'spas-local') {
        Write-Info "Removing existing 'spas-local' source..."
        & dotnet nuget remove source spas-local 2>&1 | Out-Null
    }

    # Add the source
    & dotnet nuget add source $FeedPath --name spas-local 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Status "Added 'spas-local' source to global NuGet config"
    } else {
        Write-Warning "Failed to add source to global config (may require elevated permissions)"
    }
}

function List-Packages {
    Write-Host "`nLocal NuGet Feed: " -NoNewline
    Write-Host $FeedPath -ForegroundColor Cyan
    Write-Host ""

    if (-not (Test-Path $FeedPath)) {
        Write-Warning "Feed directory does not exist. Run with -Setup first."
        return
    }

    $packages = Get-ChildItem -Path $FeedPath -Filter '*.nupkg' | Sort-Object Name

    if ($packages.Count -eq 0) {
        Write-Warning "No packages found in feed."
        return
    }

    foreach ($pkg in $packages) {
        if ($pkg.Name -match '^(.+?)\.(\d+\.\d+\.\d+.*?)\.nupkg$') {
            $name = $Matches[1]
            $version = $Matches[2]
            Write-Host "  • " -ForegroundColor Green -NoNewline
            Write-Host "$name " -NoNewline
            Write-Host $version -ForegroundColor DarkGray
        } else {
            Write-Host "  • $($pkg.Name)"
        }
    }

    Write-Host ""
    Write-Host "Total: $($packages.Count) package(s)" -ForegroundColor DarkGray
}

function Clean-Feed {
    Write-Info "Cleaning local feed..."

    if (-not (Test-Path $FeedPath)) {
        Write-Warning "Feed directory does not exist."
        return
    }

    $packages = @(Get-ChildItem -Path $FeedPath -Filter '*.nupkg' -ErrorAction SilentlyContinue)
    
    if ($packages.Count -eq 0) {
        Write-Info "Feed is already empty."
        return
    }

    foreach ($pkg in $packages) {
        Remove-Item $pkg.FullName -Force
    }

    Write-Status "Removed $($packages.Count) package(s) from feed"
}

# Main execution
try {
    Write-Host "`n" -NoNewline
    Write-Host "SPAS .NET SDK - Local NuGet Feed Manager" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""

    switch ($PSCmdlet.ParameterSetName) {
        'List' {
            List-Packages
            exit 0
        }

        'Clean' {
            Clean-Feed
            Write-Host ""
            exit 0
        }

        'Setup' {
            Ensure-FeedDirectory
            
            # Clear artifacts
            $artifactsDir = Join-Path $SdkRoot 'artifacts'
            if (Test-Path $artifactsDir) {
                Remove-Item -Path $artifactsDir -Recurse -Force
            }

            # Build and publish all packages
            $projects = Get-SdkProjects
            Write-Info "Found $($projects.Count) SDK project(s)"
            Write-Host ""

            $publishedCount = 0
            foreach ($project in $projects) {
                $package = Build-Package -ProjectFile $project
                if ($package) {
                    Publish-Package -PackageFile $package
                    $publishedCount++
                }
                Write-Host ""
            }

            Write-Status "Published $publishedCount package(s) to local feed"

            if ($Global) {
                Write-Host ""
                Add-GlobalNuGetSource
            }

            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Yellow
            Write-Host "  1. Use packages in your service by referencing the local feed"
            Write-Host "  2. Add this nuget.config to your service workspace:" -ForegroundColor DarkGray
            Write-Host ""
            Write-Host "     <packageSources>" -ForegroundColor DarkGray
            Write-Host "       <add key=`"spas-local`" value=`"$FeedPath`" />" -ForegroundColor DarkGray
            Write-Host "       <add key=`"nuget.org`" value=`"https://api.nuget.org/v3/index.json`" />" -ForegroundColor DarkGray
            Write-Host "     </packageSources>" -ForegroundColor DarkGray
            Write-Host ""
        }

        'Rebuild' {
            Write-Info "Rebuilding SDK packages..."
            Write-Host ""

            # Clean old versions
            Clean-Feed
            Write-Host ""

            # Clear artifacts
            $artifactsDir = Join-Path $SdkRoot 'artifacts'
            if (Test-Path $artifactsDir) {
                Remove-Item -Path $artifactsDir -Recurse -Force
            }

            # Build and publish
            $projects = Get-SdkProjects
            $publishedCount = 0
            foreach ($project in $projects) {
                $package = Build-Package -ProjectFile $project
                if ($package) {
                    Publish-Package -PackageFile $package
                    $publishedCount++
                }
                Write-Host ""
            }

            Write-Status "Rebuilt and published $publishedCount package(s)"

            # Clear NuGet caches to force re-download
            Write-Host ""
            Write-Info "Clearing NuGet caches..."
            & dotnet nuget locals all --clear | Out-Null
            Write-Status "NuGet caches cleared"

            Write-Host ""
        }
    }

    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor DarkGray
    exit 1
}
