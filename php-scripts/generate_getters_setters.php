<?php

if ($argc < 4) {
    echo "Usage: php generate_getters_setters.php Full\\Namespace\\ClassName [Getter|Setter|Getter + Setter] path/to/vendor/autoload.php\n";
    exit(1);
}

$className = $argv[1];
$mode = $argv[2];
$autoloadPath = $argv[3];

if (!file_exists($autoloadPath)) {
    echo "Error: Autoload Composer tidak ditemukan di '$autoloadPath'.\n";
    exit(1);
}

require_once $autoloadPath;

if (!class_exists($className)) {
    echo "Error: Class '$className' tidak ditemukan.\n";
    exit(1);
}

$reflector = new ReflectionClass($className);
$existingMethods = array_map(fn($m) => $m->getName(), $reflector->getMethods());

$getters = '';
$setters = '';

foreach ($reflector->getProperties() as $property) {
    if ($property->getDeclaringClass()->getName() !== $className) {
        continue;
    }

    if ($property->isStatic()) {
        continue;
    }

    $name = $property->getName();
    $type = $property->getType();
    $nullable = $type?->allowsNull() ?? false;
    $typeName = $type ? $type->getName() : 'mixed';
    $returnType = $nullable ? "?$typeName" : $typeName;
    $docReturnType = $nullable ? "$typeName|null" : $typeName;
    $paramType = $nullable ? "?$typeName" : $typeName;
    $paramDocType = $nullable ? "$typeName|null" : $typeName;

    $methodNameGet = 'get' . ucfirst($name);
    $methodNameSet = 'set' . ucfirst($name);

    if ($mode === 'Getter' || $mode === 'Getter + Setter') {
        $getters .= "
    public function $methodNameGet(): $returnType
    {
        return \$this->$name" . ($nullable ? " ?? null" : "") . ";
    }
";
    }

    if ($mode === 'Setter' || $mode === 'Getter + Setter') {
        $setters .= "
    public function $methodNameSet($paramType \$$name): self
    {
        \$this->$name = \$$name;
        return \$this;
    }
";
    }
}

echo trim($getters . $setters);
