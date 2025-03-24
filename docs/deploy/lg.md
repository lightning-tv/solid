# Deploying to LG WebOS Devices

## Install webOS Studio Extension for Visual Studio

I recommend using the VS Code extension - https://webostv.developer.lge.com/develop/tools/webos-studio-installation
After you install the extension you can run `WebOS Studio - Install Global Packages` to add CLI tools.

# Setting Up Developer Mode on LG webOS TV

## Install the Developer Mode App

1. Open the **LG Content Store** on your webOS TV.
2. Search for and install the **Developer Mode** app.
3. Launch the **Developer Mode** app from the webOS TV Launcher.
4. Log in with your **LG Developer account**.
5. Click the **Dev Mode Status** button to enable **Developer Mode**.

For more details, refer to the official [Developer Mode App documentation](https://webostv.developer.lge.com/develop/tools/webos-studio-dev-guide).

## Creating and Running a TV App

### Create a TV Project

I recommend simply creating an `lg/` folder in your app and adding an appinfo.json file like so:

```json
{
  "id": "com.example.soliddemo",
  "version": "1.0.0",
  "type": "web",
  "title": "Solid Demo App",
  "main": "index.html",
  "icon": "icon.png",
  "largeIcon": "largeIcon.png"
}
```

Make sure to also include the png files for launch icons. That is all it takes to create stub of an app.

### Hosted TV App

A recommended approach is a **hosted TV app**, where your entire application is hosted at a public URL, and the `index.html` file simply redirects to your hosted version. You can add `<meta http-equiv="refresh" content="0; url=https://example.com">` to the html to do a redirect.

### Deployed TV App

For a fully deployed app, we're going to build our Lightning app and then put it into the lg folder. Here is the vite build script I use for tizen
`"build:lg": "vite build --sourcemap=false --base=./ --outDir lg --emptyOutDir false && ares-package lg --outdir lg --no-minify",`

This will build all the files and place them in the lg folder (which should be a subfolder of your Lightning project). Once your app is built via vite, we run ares-package to build the app.

## Debugging webOs Apps

Follow the guide here: [https://webostv.developer.lge.com/develop/getting-started/app-debugging](https://webostv.developer.lge.com/develop/getting-started/app-debugging)

Run:
`ares-inspect -o -d tv com.example.soliddemo`

## Support Links

- **LG WebOS Web Applications**: [https://webostv.developer.lge.com/develop/getting-started/build-your-first-web-app](https://webostv.developer.lge.com/develop/getting-started/build-your-first-web-app)
- **VS Code Extension**: [https://marketplace.visualstudio.com/items?itemName=webOSSDK.webosstudio](https://marketplace.visualstudio.com/items?itemName=webOSSDK.webosstudio)
- **Brave Browser (older version)**: [https://github.com/brave/brave-browser/releases/tag/v1.2.42](https://github.com/brave/brave-browser/releases/tag/v1.2.42)
