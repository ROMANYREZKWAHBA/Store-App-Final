$f = "c:\Users\Romany\Desktop\New folder (3)\StoreApp\src\App.jsx"
$c = [System.IO.File]::ReadAllText($f)

# Tailwind classes
$c = $c.Replace('violet-600', 'teal-600')
$c = $c.Replace('violet-700', 'teal-700')
$c = $c.Replace('violet-500', 'teal-500')
$c = $c.Replace('violet-400', 'teal-400')
$c = $c.Replace('violet-100', 'teal-100')
$c = $c.Replace('violet-50', 'teal-50')

# Hex codes
$c = $c.Replace('#7c3aed', '#0d9488')
$c = $c.Replace('#9333ea', '#0f766e')
$c = $c.Replace('#6366f1', '#0d9488')
$c = $c.Replace('#818cf8', '#2dd4bf')
$c = $c.Replace('#a78bfa', '#5eead4')

# Related bg colors
$c = $c.Replace('#ede9fe', '#ccfbf1')
$c = $c.Replace('#faf5ff', '#f0fdfa')

# indigo references
$c = $c.Replace('indigo-200', 'teal-200')
$c = $c.Replace('indigo-300', 'teal-300')

[System.IO.File]::WriteAllText($f, $c)
Write-Host "Done! Colors replaced successfully."
