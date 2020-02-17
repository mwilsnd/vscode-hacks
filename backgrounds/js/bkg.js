// Easy presets for image layouts
const preset = {
    position: {
        leftAlignBottom: ["left", "bottom"],
        leftAlignCenter: ["left", "center"],
        leftAlignTop: ["left", "top"],
        rightAlignBottom: ["right", "bottom"],
        rightAlignCenter: ["right", "center"],
        rightAlignTop: ["right", "top"],
        center: ["center", "center"],
    },
    size: {
        fillWidth: ["100%", "auto"],
        fillHeight: ["auto", "100%"],
        normal: ["auto", "auto"],
        stretch: ["100%", "100%"],
    },
};

// Each entry applies to the next split view, with entry 0 as the main view
// Images go in %USERPROFILE%/.vscode/backgrounds
let images = [
    {
        img: "left.png",
        rep: "no-repeat",
        pos: preset.position.rightAlignBottom,
        size: preset.size.normal,
    },
    {
        img: "right.png",
        rep: "no-repeat",
        pos: preset.position.leftAlignBottom,
        size: preset.size.normal,
    },
];

let sidebarImage = {
    img: "sidebar.png",
    rep: "no-repeat",
    pos: preset.position.leftAlignBottom,
    size: preset.size.fillWidth,
};

const config = {
    ENABLE_SIDEBAR_IMAGE: false, // Apply the sidebarImage to the explorer sidebar
    EXPLORER_SELECTED_COLOR: [44, 49, 58, 0.5], // Color of the selected element
    EXPLORER_HEADER_COLOR: [38, 42, 50, 0.75], // Color of headers

    CURRENT_LINE_COLOR: [0, 0, 0, 0.33], // Background color of the active line

    ENABLE_TEXT_BG: true, // Enable a background color for all lines of text
    TEXT_BG_ALPHA: 0.5, // Alpha

    ENABLE_MINIMAP_TRANSPARENCY: true, // Enable the transparent minimap
    ENABLE_MINIMAP_BLUR: false, // When transparent, should we use the blur filter?
    MINIMAP_BLUR: 8, // Pixel size of the blur

    // Enable text shadows
    ENABLE_TEXT_SHADOWS: true,
    // Shadows to use in light mode
    TEXT_SHADOWS_LIGHT: `
    1px 0px 2px rgba(0, 0, 0, 0.1), 1px 1px 6px rgba(0.66, 0.66, 0.66, 0.12),
    1px 1px 2px rgba(0, 0, 0, 0.1), 1px 1px 6px rgba(0.66, 0.66, 0.66, 0.12),
    -1px 0px 2px rgba(0, 0, 0, 0.1), -1px -1px 6px rgba(0.66, 0.66, 0.66, 0.12),
    -1px -1px 2px rgba(0, 0, 0, 0.1), -1px -1px 6px rgba(0.66, 0.66, 0.66, 0.12);`,
    // Shadows to use in dark mode
    TEXT_SHADOWS_DARK: `
    1px 0px 3px rgb(29, 29, 29),
    1px 1px 3px rgb(29, 29, 29),
    -1px 0px 3px rgb(29, 29, 29),
    -1px -1px 3px rgb(29, 29, 29);`,
    
    // Color of the line numbers when using a light theme
    LINE_NUM_COLOR_LIGHT: "rgb(185, 185, 185)",
    // Color of the line numbers when using a dark theme
    LINE_NUM_COLOR_DARK: "rgb(155, 155, 155)",
    ENABLE_LINE_NUM_RECOLOR: true, // Enable line number recoloring
    ENABLE_LINE_NUM_SHADOWS: true, // Enable shadows on line numbers
    ENABLE_LINE_NUM_BLUR: true, // Enable line number blur
    LINE_NUM_BLUR: 8, // Pixel size of the blur

    // Color of the editor background when using a light theme
    // Does not change the color, rather uses it as a reference for other changes
    // Update this value to match your theme for proper blending with the minimap
    BG_COLOR_REF_LIGHT: [255, 255, 255],
    // Color of the editor background when using a dark theme
    // Does not change the color, rather uses it as a reference for other changes
    // Update this value to match your theme for proper blending with the minimap
    BG_COLOR_REF_DARK: [29, 29, 29],
};

let CURRENT_TEXT_COLOR_REF = config.LINE_NUM_COLOR_DARK;
let CURRENT_COLOR_REF = config.BG_COLOR_REF_DARK;
let CURRENT_TEXT_SHADOWS = config.TEXT_SHADOWS_DARK;

const handlers = {
    ["childList"]: {
        ["editor-instance"]: (mutation) => { 
            updateAllViews();
            return true;
        },
    },
    ["attributes"]: {
        ["minimap-decorations-layer"]: (mutation) => {
            // Adjust for minimap size
            updateAllViews();
            return true;
        },
    },
};

let updateSidebar = () => {
    let view = document.getElementById("workbench.view.explorer");
    view.style.backgroundImage = sidebarImage.urlPath;
    view.style.backgroundPosition = sidebarImage.pos[0] + " " + sidebarImage.pos[1];
    view.style.backgroundSize = sidebarImage.size[0] + " " + sidebarImage.size[1];
    view.style.backgroundRepeat = sidebarImage.rep;
};

// Update all split views
let updateAllViews = () => {
    let views = document.querySelectorAll(
        ".split-view-container > .split-view-view > .editor-group-container > .editor-container" +
        " > .editor-instance > .monaco-editor > .overflow-guard"
    );
    
    for (let i = 0; i < views.length; i++) {
        let view = views[i];
        const minimap = view.querySelector(".minimap");
        if (minimap == null) continue;
        updateViewImage(view, minimap, images[i]);
    }

    if (config.ENABLE_SIDEBAR_IMAGE)
        updateSidebar();
};

// Update the background image for a split view
let updateViewImage = (view, minimap, image) => {
    if (image == null) return;

    // Offset right by minimap width
    let posX = image.pos[0];
    if (image.allowMinimapOffset && posX == "right") {
        posX = posX + " " + minimap.clientWidth + "px";
    }
    
    view.style.backgroundImage = image.urlPath;
    view.style.backgroundPosition = posX + " " + image.pos[1];
    view.style.backgroundSize = image.size[0] + " " + image.size[1];
    view.style.backgroundRepeat = image.rep;
    view.style.position = "absolute";
};

let easeOutExpo = function(pos) {
    return (pos===1) ? 1 : -Math.pow(2, -10 * pos) + 1;
};

// Linear to luma, on an exp scale
let rgbToLumaExp = (r, g, b) => {
    r = r == CURRENT_COLOR_REF[0] ? 0 : r;
    g = g == CURRENT_COLOR_REF[1] ? 0 : g;
    b = b == CURRENT_COLOR_REF[2] ? 0 : b;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma == 0 ? 0 : easeOutExpo(luma / 255);
};

// Yes, this is going to be expensive
let putImageOverrideAlpha = (imageData) => {
    const dataLen = imageData.width * imageData.height * 4;
    let copy = new Uint8ClampedArray(dataLen);
    // At least we can fit 2 pixels per cache line though
    for (let i = 0; i < dataLen; i += 4) {
        copy[i] = imageData.data[i];
        copy[i+1] = imageData.data[i+1];
        copy[i+2] = imageData.data[i+2];
        // Compute the new alpha based on the luminance of r,g,b
        // This allows areas with code to remain visible while
        // the background goes to 0 alpha
        copy[i+3] = Math.floor(
            rgbToLumaExp(imageData.data[i], imageData.data[i+1], imageData.data[i+2]) * 255
        );
    }
    return new ImageData(copy, imageData.width, imageData.height);
};

// Inject some css tweaks
let applyUnblockableShtoyles = () => {
    let s = `
    .monaco-editor .current-line {
        background-color: rgba(` + config.CURRENT_LINE_COLOR.join(",") + `) !important;
        border-style: solid;
        border-top-width: 2px;
        border-bottom-width: 2px;
        border-left-width: 0;
        border-right-width: 0;
        border-color: #424242;
    }
    
    .split-view-container > .split-view-view > .editor-group-container > .editor-container >
    .editor-instance > .monaco-editor > .overflow-guard > .monaco-scrollable-element > .monaco-editor-background
    {
        background: none !important;
        background-color: rgba(0, 0, 0, 0) !important;
    }
    
    .monaco-editor .minimap {
        background-color: rgba(0, 0, 0, 0.001); ` +
        (config.ENABLE_MINIMAP_BLUR ? "backdrop-filter: blur(" + config.MINIMAP_BLUR + "px); " : "")
    + `}
    
    .monaco-editor .margin {
        background-color: rgba(` + CURRENT_COLOR_REF.join(",") + `, ` + config.TEXT_BG_ALPHA + `); ` +
        (config.ENABLE_LINE_NUM_BLUR ? "backdrop-filter: blur(" + config.LINE_NUM_BLUR + "px); " : "")
    + `}`;

    if (config.ENABLE_TEXT_SHADOWS)
        s = s +
        `.split-view-container > .split-view-view > .editor-group-container > .editor-container >
        .editor-instance > .monaco-editor span
        {
            text-shadow: ` + CURRENT_TEXT_SHADOWS + `;
            
        }`;

    if (config.ENABLE_TEXT_BG)
        s = s +
        `.split-view-container > .split-view-view > .editor-group-container > .editor-container >
        .editor-instance > .monaco-editor .view-line > span
        {
            box-shadow: 0 0 0 1px rgba(` + CURRENT_COLOR_REF.join(",") + `, ` + config.TEXT_BG_ALPHA + `);
            background-color: rgba(` + CURRENT_COLOR_REF.join(",") + `, ` + config.TEXT_BG_ALPHA + `);
        }`;

    if (config.ENABLE_LINE_NUM_RECOLOR)
        s = s +
        `.monaco-editor .line-numbers {
            color: ` + CURRENT_TEXT_COLOR_REF + ` !important;
            ` + (config.ENABLE_LINE_NUM_SHADOWS ?
                "text-shadow: " + CURRENT_TEXT_SHADOWS
                : ""
            ) + `
        }`;
    
    if (config.ENABLE_SIDEBAR_IMAGE)
        s = s + `
        .split-view-view > .sidebar > .content > .explorer-viewlet .monaco-list-rows {
            background: none !important;
        }

        .split-view-view > .sidebar > .content > .explorer-viewlet .monaco-list-row.selected {
            background-color: rgba(` + config.EXPLORER_SELECTED_COLOR.join(",") + `) !important;
        }

        .split-view-view > .sidebar > .content > .explorer-viewlet .pane-header {
            background-color: rgba(` + config.EXPLORER_HEADER_COLOR.join(",") + `) !important;
        }

        .split-view-view > .sidebar > .content > .explorer-viewlet {
            background-color: rgba(0, 0, 0, 0) !important;
        }
        `;
    
    let node = document.createElement('style');
    node.innerHTML = s;
    document.body.appendChild(node);
};

let applyHax = () => {
    let vs = document.getElementsByClassName("vs-dark")[0];
    if (vs == null) {
        // Light mode
        vs = document.getElementsByClassName("vs")[0];
        CURRENT_TEXT_COLOR_REF = config.LINE_NUM_COLOR_LIGHT;
        CURRENT_COLOR_REF = config.BG_COLOR_REF_LIGHT;
        CURRENT_TEXT_SHADOWS = config.TEXT_SHADOWS_LIGHT;
    } else {
        // Dark mode
        CURRENT_TEXT_COLOR_REF = config.LINE_NUM_COLOR_DARK;
        CURRENT_COLOR_REF = config.BG_COLOR_REF_DARK;
        CURRENT_TEXT_SHADOWS = config.TEXT_SHADOWS_DARK;
    }

    applyUnblockableShtoyles();

    // Detour putImageData so we can hack the image data for the minimap
    if (config.ENABLE_MINIMAP_TRANSPARENCY) {
        window.addEventListener("DOMContentLoaded", (event) => {
            const __putImageData = CanvasRenderingContext2D.prototype.putImageData;
            CanvasRenderingContext2D.prototype.putImageData = function(
                imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight
            ) {
                if (this.canvas.parentElement.className == "minimap slider-mouseover")
                    __putImageData.call(
                        this,
                        putImageOverrideAlpha(imageData),
                        dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight
                    );
                else
                    __putImageData.call(
                        this,
                        imageData,
                        dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight
                    );
            }
        });
    }

    new MutationObserver((mutations, observer) => {
        for (let mutation of mutations) {
            const group = handlers[mutation.type];
            if (group == null) continue;
    
            const handler = group[mutation.target.className];
            if (handler == null) continue;
    
            if (handler(mutation)) return;
        }
    }).observe(vs, {
        attributes: true,
        childList: true,
        subtree: true,
    
        // For attribs, we only care about width for the minimap offset
        attributeFilter: ["width"],    
    });

    const userFolder = process.cwd().replace(/\\/gi, "/") + "/../../../../.vscode/backgrounds/";
    images.forEach(img => {
        const path = "file:///" + userFolder + img.img;
        img.urlPath = "url('" + path + "')";
    });

    if (config.ENABLE_SIDEBAR_IMAGE) {
        const path = "file:///" + userFolder + sidebarImage.img;
        sidebarImage.urlPath = "url('" + path + "')";
    }
};

applyHax();