# QuickPaste — CEP Extension for AE & Premiere

> [!IMPORTANT]
> **QuickPaste has moved into [LazyKick](https://github.com/raisulsohan/LazyKick), where it is now called LazyPaste.**
> This repository is archived and no longer updated.
>
> LazyKick installs with one double-click (signed, no PlayerDebugMode). Its LazyPaste keeps PNG transparency, pastes image files copied in Explorer/Finder, reuses a picture you already pasted, never overwrites an earlier paste, and never shifts clips in Premiere Pro. It has a Ctrl/Cmd+V shortcut too. The same panel also has project notes with timecodes and auto-importing watch folders.
>
> **[⬇️ Download LazyKick](https://github.com/raisulsohan/LazyKick/releases/latest)**

---

Pastes the current clipboard image into After Effects or Premiere Pro with one click. 
The image is saved as a PNG file to `<project_folder>/Pasted Images/` and automatically imported into your active timeline.

## New Features
- **Slim UI:** Super compact design (only 40px height) to save your workspace.
- **Smart Track Targeting (PPRO):** Automatically finds the first empty video track at your playhead to avoid overwriting your edits.
- **Dynamic Feedback:** The button itself shows progress and success messages.
- **Path Safety:** Fixed issues with special characters and quotes in project paths.

## Install

### 1. Enable PlayerDebugMode (one-time)

**Windows** — Open `regedit`, go to `HKEY_CURRENT_USER\Software\Adobe\CSXS.11` (also 10 or 12 if present), and add a String value:
- Name: `PlayerDebugMode`
- Value: `1`

**macOS** — Open Terminal:
```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1

2. Copy the QuickPaste folder to:
Windows:
C:\Users\<you>\AppData\Roaming\Adobe\CEP\extensions\QuickPaste

macOS:
~/Library/Application Support/Adobe/CEP/extensions/QuickPaste

3. Restart AE / Premiere
Open the panel from:

Window > Extensions > QuickPaste

Usage
Save your project: The script needs a saved project to know where to store the images.

Copy an image: Right-click and "Copy Image" from any browser or software.

Click "Paste Image": - In After Effects: Adds to the active comp at the current time.

In Premiere Pro: Finds the first empty track at the playhead and places the image.

Made by raisulsohan raisulsohan.com
Made by Raisul Sohan
