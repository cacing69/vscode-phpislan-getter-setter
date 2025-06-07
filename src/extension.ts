import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { extractProperties, findInsertionPosition } from './utils/utils';
import { generateMethods } from './utils/tsGenerator';

// default config for extension
const CONFIG_KEY = "phpGetterSetterGenerator";

export function activate(context: vscode.ExtensionContext) {

    // load config for extension usage
    const config = vscode.workspace.getConfiguration(CONFIG_KEY);

    function cariAutoloadPath(startPath: string): string | null {
        let dir = startPath;
        while (dir !== path.dirname(dir)) {
            const autoloadPath = path.join(dir, 'vendor', 'autoload.php');
            if (fs.existsSync(autoloadPath)) {
                return autoloadPath;
            }
            dir = path.dirname(dir);
        }
        return null;
    }

    let disposable = vscode.commands.registerCommand('phpislan-getter-setter.generate', async () => {

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Tidak ada file PHP yang sedang dibuka.');
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'php') {
            vscode.window.showErrorMessage('File aktif bukan file PHP.');
            return;
        }

        const text = document.getText();

        let generateGetter = false;
        let generateSetter = false;

        const generatorMode = config.get<string>("generatorMode");

        const enableComment = config.get<boolean>("enableComment", false);

        const pilihan = await vscode.window.showQuickPick(
            ['Getter', 'Setter', 'Getter + Setter'],
            { placeHolder: 'Pilih jenis method yang ingin digenerate' }
        );


        if (!pilihan) {
            vscode.window.showInformationMessage('Proses generate dibatalkan.');
            return;
        } else {
            switch (pilihan) {
                case "Getter":
                    generateGetter = true;
                    break;
                case "Setter":
                    generateSetter = true;
                    break;
                case "Getter + Setter":
                    generateGetter = true;
                    generateSetter = true;
                    break;
                default:
                    break;
            }
        }

        if (generatorMode === `php`) {
            const nsMatch = text.match(/namespace\s+([^;]+);/);
            const namespace = nsMatch ? nsMatch[1].trim() : '';

            const classMatch = text.match(/class\s+(\w+)/);
            if (!classMatch) {
                vscode.window.showErrorMessage('Tidak ditemukan deklarasi class di file ini.');
                return;
            }
            const className = classMatch[1];
            const fullClassName = namespace ? `${namespace}\\${className}` : className;

            const autoloadPath = cariAutoloadPath(document.uri.fsPath);
            if (!autoloadPath) {
                vscode.window.showErrorMessage('vendor/autoload.php tidak ditemukan di folder proyek.');
                return;
            }

            const phpPath = config.get<string>("phpPath");

            const scriptPath = context.asAbsolutePath('php-scripts/generate_getters_setters.php');

            exec(`${phpPath} "${scriptPath}" "${fullClassName}" "${pilihan}" "${autoloadPath}"`, (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`Error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    vscode.window.showWarningMessage(`Warning: ${stderr}`);
                }

                if (!stdout.trim()) {
                    vscode.window.showInformationMessage('Tidak ada method yang dihasilkan.');
                    return;
                }

                const lastBracePos = text.lastIndexOf('}');

                if (lastBracePos === -1) {
                    vscode.window.showErrorMessage('Tidak ditemukan tanda } penutup class.');
                    return;
                }

                const position = document.positionAt(lastBracePos);

                editor.edit(editBuilder => {
                    editBuilder.insert(position, '\n\n\t' + stdout.trim() + '\n');
                });

                vscode.window.showInformationMessage(`${pilihan} berhasil di-generate dan di-insert.`);
            });
        } else if (generatorMode === `ts`) {

            // Cari class
            const classRegex = /class\s+(\w+)(?:\s+extends\s+[\w\\]+)?(?:\s+implements\s+[\w\\]+(?:\s*,\s*[\w\\]+)*)?\s*{([^}]*)}/gs;
            const matches = [...text.matchAll(classRegex)];

            if (matches.length === 0) {
                vscode.window.showInformationMessage('No classes found in this file.');
                return;
            }

            const edit = new vscode.WorkspaceEdit();

            for (const match of matches) {
                const fullClass = match[0];
                const classBody = match[2];

                const props = extractProperties(classBody);
                if (props.length === 0) { continue; }

                props.forEach(prop => {
                    const { visibility, rawDeclaration } = prop;
                    const nameMatch = rawDeclaration.match(/\$(\w+)/);
                    if (!nameMatch) { return; }

                    const name = nameMatch[1];
                    const typePart = rawDeclaration.replace(/\$(\w+)/, '').trim();

                    const { getter, setter } = generateMethods(name, typePart, visibility, enableComment, generateGetter, generateSetter);

                    const insertionPos = findInsertionPosition(fullClass);
                    const insertionOffset = document.positionAt(document.getText().indexOf(fullClass) + insertionPos);

                    if (getter) { edit.insert(document.uri, insertionOffset, getter); }
                    if (setter) { edit.insert(document.uri, insertionOffset, setter); }
                });
            }

            vscode.workspace.applyEdit(edit).then(() => {
                vscode.window.showInformationMessage('Getter and Setter generated successfully!');
            });
        }

    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }
