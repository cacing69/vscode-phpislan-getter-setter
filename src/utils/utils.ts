export const findInsertionPosition = (fullClass: string): number => {
    const lines = fullClass.split('\n');
    let lastPropertyLineIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/(public|protected|private)\s+\$/.test(line)) {
            lastPropertyLineIndex = i;
        }
    }

    if (lastPropertyLineIndex !== -1) {
        return fullClass.indexOf(lines[lastPropertyLineIndex]) + lines[lastPropertyLineIndex].length;
    }

    const closingBraceIndex = fullClass.lastIndexOf('}');
    return closingBraceIndex !== -1 ? closingBraceIndex : fullClass.length;
};