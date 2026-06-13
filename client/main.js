/* * QuickPaste - CEP Extension
 * Made by raisulsohan
 * raisulsohan.com
 */
(function () {
    var cs = new CSInterface();
    var fs = require('fs');
    var path = require('path');
    var execSync = require('child_process').execSync;

    var btn = document.getElementById('pasteBtn');
    var originalBtnText = btn.textContent;
    var resetTimer = null;

    // আলাদা স্ট্যাটাস বারের বদলে বাটনেই মেসেজ দেখাবে
    function setStatus(msg, type) {
        btn.textContent = msg;
        if (type === 'error') {
            btn.style.background = '#ff6b6b';
        } else if (type === 'success') {
            btn.style.background = '#51cf66';
        } else {
            btn.style.background = '#555'; // প্রসেসিং হওয়ার সময়
        }
        
        if (resetTimer) clearTimeout(resetTimer);
        
        // ৩ সেকেন্ড পর বাটন আগের অবস্থায় ফিরে আসবে
        if (type === 'error' || type === 'success') {
            resetTimer = setTimeout(function() {
                btn.textContent = originalBtnText;
                btn.style.background = '';
                btn.disabled = false;
            }, 3000);
        }
    }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function makeFilename() {
        var d = new Date();
        return 'pasted_' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
            '_' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.png';
    }

    function getProjectFolder(callback) {
        cs.evalScript('getProjectFolder()', function (result) {
            if (!result || result === 'EvalScript error.' || result === 'NO_PROJECT') {
                callback(null);
            } else {
                callback(result);
            }
        });
    }

    function saveClipboardImageWindows(targetPath) {
        var safePath = targetPath.replace(/'/g, "''").replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        var ps = "Add-Type -AssemblyName System.Windows.Forms; " +
            "Add-Type -AssemblyName System.Drawing; " +
            "$img = [System.Windows.Forms.Clipboard]::GetImage(); " +
            "if ($img -ne $null) { " +
            "$img.Save('" + safePath + "', [System.Drawing.Imaging.ImageFormat]::Png); " +
            "Write-Output 'OK' " +
            "} else { Write-Output 'NO_IMAGE' }";
        var out = execSync('powershell -NoProfile -ExecutionPolicy Bypass -Command "' + ps + '"',
            { windowsHide: true }).toString().trim();
        return out.indexOf('OK') !== -1;
    }

    function saveClipboardImageMac(targetPath) {
        var safePath = targetPath.replace(/"/g, '\\"');
        var script =
            'try\n' +
            '  set png_data to (the clipboard as «class PNGf»)\n' +
            '  set fp to open for access POSIX file "' + safePath + '" with write permission\n' +
            '  set eof of fp to 0\n' +
            '  write png_data to fp\n' +
            '  close access fp\n' +
            '  return "OK"\n' +
            'on error\n' +
            '  try\n' +
            '    close access fp\n' +
            '  end try\n' +
            '  return "NO_IMAGE"\n' +
            'end try';
        var out = execSync('osascript -e ' + JSON.stringify(script)).toString().trim();
        return out === 'OK';
    }

    function saveClipboardImage(targetPath) {
        if (process.platform === 'win32') return saveClipboardImageWindows(targetPath);
        if (process.platform === 'darwin') return saveClipboardImageMac(targetPath);
        return false;
    }

    btn.addEventListener('click', function () {
        if (btn.disabled) return;
        btn.disabled = true;
        setStatus('Reading clipboard...', 'processing');

        getProjectFolder(function (projectFolder) {
            if (!projectFolder) {
                setStatus('Save project first!', 'error');
                return;
            }

            var pastedDir = path.join(projectFolder, 'Pasted Images');
            try {
                if (!fs.existsSync(pastedDir)) {
                    fs.mkdirSync(pastedDir, { recursive: true });
                }
            } catch (e) {
                setStatus('Folder error', 'error');
                return;
            }

            var filename = makeFilename();
            var fullPath = path.join(pastedDir, filename);

            var ok = false;
            try {
                ok = saveClipboardImage(fullPath);
            } catch (e) {
                setStatus('Clipboard error', 'error');
                return;
            }

            if (!ok) {
                setStatus('No image found!', 'error');
                return;
            }

            var jsxPath = fullPath.replace(/\\/g, '/').replace(/'/g, "\\'");
            cs.evalScript("importImage('" + jsxPath + "')", function (res) {
                if (res === 'OK_LAYER' || res === 'OK_CLIP') {
                    setStatus('Success!', 'success');
                } else if (res === 'OK_IMPORT') {
                    setStatus('Imported to Bin', 'success');
                } else {
                    setStatus('Import failed', 'error');
                }
            });
        });
    });
})();