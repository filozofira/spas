[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string[]]$ZipPaths
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-ZipEntries([string]$zipPath) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
  try { return $zip.Entries | ForEach-Object { $_.FullName } }
  finally { $zip.Dispose() }
}

function Get-ZipTextFile([string]$zipPath, [string]$entryName) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
  try {
    $entry = $zip.GetEntry($entryName)
    if (-not $entry) { return $null }

    $stream = $entry.Open()
    try {
      $reader = New-Object System.IO.StreamReader($stream)
      try { return $reader.ReadToEnd() }
      finally { $reader.Dispose() }
    } finally { $stream.Dispose() }
  } finally { $zip.Dispose() }
}

function Collect-SchemaRefs($node, [System.Collections.Generic.HashSet[string]]$refs) {
  if ($null -eq $node) { return }

  if ($node -is [System.Collections.IDictionary]) {
    foreach ($k in $node.Keys) {
      $v = $node[$k]
      if ($k -eq 'schemaRef' -and $v -is [string] -and -not [string]::IsNullOrWhiteSpace($v)) {
        [void]$refs.Add($v)
      } else {
        Collect-SchemaRefs -node $v -refs $refs
      }
    }
    return
  }

  if ($node -is [System.Collections.IEnumerable] -and -not ($node -is [string])) {
    foreach ($item in $node) { Collect-SchemaRefs -node $item -refs $refs }
    return
  }
}

foreach ($zipPath in $ZipPaths) {
  Write-Output ""
  Write-Output "=== VALIDATING: $zipPath ==="

  if (-not (Test-Path $zipPath)) {
    Write-Output "FAIL: Missing file"
    continue
  }

  $entries = Get-ZipEntries $zipPath
  $entrySet = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  foreach ($e in $entries) { [void]$entrySet.Add($e) }

  if (-not $entrySet.Contains('spas.json')) {
    Write-Output "FAIL: spas.json missing"
    continue
  }

  $spasJsonText = Get-ZipTextFile -zipPath $zipPath -entryName 'spas.json'
  if ([string]::IsNullOrWhiteSpace($spasJsonText)) {
    Write-Output "FAIL: spas.json empty/unreadable"
    continue
  }

  try {
    $spas = $spasJsonText | ConvertFrom-Json -Depth 100
  } catch {
    Write-Output ("FAIL: spas.json invalid JSON: {0}" -f $_.Exception.Message)
    continue
  }

  $refs = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  Collect-SchemaRefs -node $spas -refs $refs

  Write-Output ("Entries: {0}" -f $entries.Count)
  Write-Output ("schemaRef count (unique): {0}" -f $refs.Count)

  $missing = @()
  foreach ($r in $refs) {
    if (-not $entrySet.Contains($r)) { $missing += $r }
  }

  if ($missing.Count -gt 0) {
    Write-Output "WARN: missing schemaRef targets:"
    $missing | Sort-Object | ForEach-Object { Write-Output (" - {0}" -f $_) }
  } else {
    Write-Output "OK: all schemaRef targets exist in zip"
  }

  $schemaEntries = $entries | Where-Object { $_ -match '^schemas/(events|endpoints)/.+\.schema\.json$' }
  Write-Output ("Schema files present: {0}" -f $schemaEntries.Count)

  $nonCanonical = $entries | Where-Object { $_ -match '^schemas/' -and $_ -notmatch '^schemas/(events|endpoints)/.+\.schema\.json$' }
  if ($nonCanonical.Count -gt 0) {
    Write-Output "WARN: non-canonical schemas/* paths present:"
    $nonCanonical | Sort-Object | ForEach-Object { Write-Output (" - {0}" -f $_) }
  }
}
