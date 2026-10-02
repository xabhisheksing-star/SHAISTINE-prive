param (
    [int]$Port = 8080,
    [string]$Directory = "."
)

$baseDir = (Resolve-Path $Directory).Path
$csPath = Join-Path $PSScriptRoot "StaticServer.cs"

Add-Type -Path $csPath

$server = New-Object StaticServer($baseDir, $Port)
$server.Start()

Write-Output "SERVER_READY: http://localhost:$Port/"

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    $server.Stop()
}
