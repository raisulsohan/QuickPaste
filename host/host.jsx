/*
 * QuickPaste
 * Made by raisulsohan
 * raisulsohan.com
 */

// Returns absolute path of the project's parent folder, or 'NO_PROJECT'
function getProjectFolder() {
    try {
        if (typeof app.project.file !== 'undefined' && app.project.file !== null) {
            return app.project.file.parent.fsName;
        }
        if (typeof app.project.path !== 'undefined' && app.project.path && app.project.path !== '') {
            var f = new File(app.project.path);
            return f.parent.fsName;
        }
        return 'NO_PROJECT';
    } catch (e) {
        return 'NO_PROJECT';
    }
}

function _isAE() { return typeof app.project.importFile === 'function'; }
function _isPPRO() {
    return app.project && app.project.rootItem && typeof app.project.importFiles === 'function';
}

// Imports the file. If an active comp/sequence exists, also places it at the playhead.
// Returns: 'OK_LAYER' | 'OK_CLIP' | 'OK_IMPORT' | error string
function importImage(filePath) {
    try {
        var f = new File(filePath);
        if (!f.exists) return 'File not found';

        // ---------- AFTER EFFECTS ----------
        if (_isAE()) {
            var io = new ImportOptions(f);
            var footageItem = app.project.importFile(io);

            // "Pasted Images" ফোল্ডার খোঁজা বা তৈরি করা
            var targetFolder = null;
            for (var i = 1; i <= app.project.items.length; i++) {
                if (app.project.items[i] instanceof FolderItem && app.project.items[i].name === "Pasted Images") {
                    targetFolder = app.project.items[i];
                    break;
                }
            }
            if (!targetFolder) {
                targetFolder = app.project.items.addFolder("Pasted Images");
            }
            // ফুটেজটিকে সেই ফোল্ডারে মুভ করা
            footageItem.parentFolder = targetFolder;

            var active = app.project.activeItem;
            if (active && (active instanceof CompItem)) {
                app.beginUndoGroup('Paste Image to Comp');
                try {
                    var layer = active.layers.add(footageItem);
                    try { layer.startTime = active.time; } catch (e) {}
                } finally {
                    app.endUndoGroup();
                }
                return 'OK_LAYER';
            }
            return 'OK_IMPORT';
        }

        // ---------- PREMIERE PRO ----------
        if (_isPPRO()) {
            var root = app.project.rootItem;

            // "Pasted Images" বিন খোঁজা বা তৈরি করা
            var targetBin = null;
            for (var b = 0; b < root.children.numItems; b++) {
                var child = root.children[b];
                // ProjectItemType.BIN = 2
                if (child.type === 2 && child.name === "Pasted Images") {
                    targetBin = child;
                    break;
                }
            }
            if (!targetBin) {
                targetBin = root.createBin("Pasted Images");
            }

            // ইম্পোর্টের আগে নতুন বিনের স্ন্যাপশট নেওয়া
            var before = {};
            for (var i = 0; i < targetBin.children.numItems; i++) {
                try { before[targetBin.children[i].nodeId] = true; } catch (e) {}
            }

            // সরাসরি "Pasted Images" বিনে ফাইল ইম্পোর্ট করা
            app.project.importFiles([filePath], false, targetBin, false);

            var newItem = null;
            for (var j = 0; j < targetBin.children.numItems; j++) {
                var c = targetBin.children[j];
                try {
                    if (!before[c.nodeId]) { newItem = c; break; }
                } catch (e) {}
            }

            var seq = app.project.activeSequence;
            if (newItem && seq && seq.videoTracks && seq.videoTracks.numTracks > 0) {
                var t = seq.getPlayerPosition();
                var targetTrack = null;

                // প্লেহেডের পজিশনে কোন ট্র্যাকটি খালি আছে তা খোঁজা
                for (var k = 0; k < seq.videoTracks.numTracks; k++) {
                    var track = seq.videoTracks[k];
                    var hasClipAtPlayhead = false;
                    
                    for (var c_idx = 0; c_idx < track.clips.numItems; c_idx++) {
                        var clip = track.clips[c_idx];
                        if (clip.start.seconds <= t.seconds && clip.end.seconds > t.seconds) {
                            hasClipAtPlayhead = true;
                            break;
                        }
                    }
                    
                    if (!hasClipAtPlayhead) {
                        targetTrack = track;
                        break;
                    }
                }

                // যদি সব ট্র্যাকেই ক্লিপ থাকে, তবে সবচেয়ে ওপরের ট্র্যাকে পেস্ট করবে
                if (!targetTrack) {
                    targetTrack = seq.videoTracks[seq.videoTracks.numTracks - 1];
                }

                try {
                    targetTrack.overwriteClip(newItem, t);
                    return 'OK_CLIP';
                } catch (e1) {
                    try {
                        targetTrack.insertClip(newItem, t);
                        return 'OK_CLIP';
                    } catch (e2) {
                        return 'OK_IMPORT';
                    }
                }
            }
            return 'OK_IMPORT';
        }

        return 'Unsupported host';
    } catch (e) {
        return e.toString();
    }
}