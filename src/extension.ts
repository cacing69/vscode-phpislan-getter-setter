import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {

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

        const pilihan = await vscode.window.showQuickPick(
            ['Getter', 'Setter', 'Getter + Setter'],
            { placeHolder: 'Pilih jenis method yang ingin digenerate' }
        );

        if (!pilihan) {
            vscode.window.showInformationMessage('Proses generate dibatalkan.');
            return;
        }

        const phpPath = 'php';
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
                editBuilder.insert(position, '\n\n' + stdout.trim() + '\n');
            });

            vscode.window.showInformationMessage(`${pilihan} berhasil di-generate dan di-insert.`);
        });

    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
