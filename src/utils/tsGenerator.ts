export interface GeneratedMethod {
    getter?: string;
    setter?: string;
}

export const generateMethods = (
    name: string,
    typePart: string,
    visibility: string,
    enableComment: boolean,
    generateGetter: boolean = true,
    generateSetter: boolean = true
): GeneratedMethod => {
    const ucFirst = name.charAt(0).toUpperCase() + name.slice(1);
    const getterName = `get${ucFirst}`;
    const setterName = `set${ucFirst}`;

    let result: GeneratedMethod = {};

    if (generateGetter) {
        const isNullable = typePart.startsWith('?');
        const getterBody = isNullable
            ? `return $this->${name} ?? null;`
            : `return $this->${name};`;

        const getterComment = enableComment
            ? `\n    /**\n     * @return ${visibility} ${typePart} $${name}\n     */`
            : '';

        const getter = `\n    public function ${getterName}(): ${typePart}\n    {\n        ${getterBody}\n    }\n`;

        result.getter = getterComment + getter;
    }

    if (generateSetter) {
        const setterComment = enableComment
            ? `\n    /**\n     * @param ${visibility} ${typePart} $${name}\n     * @return self\n     */`
            : '';

        const setter = `\n    public function ${setterName}(${typePart} $${name}): self\n    {\n        $this->${name} = $${name};\n        return $this;\n    }\n`;

        result.setter = setterComment + setter;
    }

    return result;
};