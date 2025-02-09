# Deploying to Tizen Devices

## Install Tizen Extension and Software

I recommend using the VS Code extension rather than the Eclipse-based Tizen Studio. With VS Code, add the [Tizen extension](https://marketplace.visualstudio.com/items?itemName=tizen.vscode-tizen-csharp) and follow the [installation instructions](https://marketplace.visualstudio.com/items?itemName=tizen.vscode-tizen-csharp) to install all dependencies. The extension requires the Tizen Baseline SDK to be installed.

### Install TV Profile

Launch the Tizen Package Manager, click on **Extensions**, and install the `TV Extensions` package. This will provide the base project setup for a TV app and the simulator.

### Create a Certificate

Launch the Tizen Certificate Manager and create a signed certificate to run and deploy your TV application.

## Connecting to a TV

### Enabling Developer Mode

1. Open the **Smart Hub**.
2. Select the **Apps** panel.
3. Enter `12345` using the remote or on-screen keypad.
4. Turn **Developer mode** to **On**.
5. Enter the IP address of the computer you want to connect to the TV (if your laptop's IP changes, you need to update this IP, or you won't be able to connect).
6. Click **OK**.
7. Reboot the TV.

### Launch Device Manager

Add a new device with the IP address of the TV. Click the **Connection Toggle** to **ON**. If everything is working, you should see connected devices in VS Code, and we're now ready to launch an app.

## Creating and Running a TV App

### Create a TV Project

I recommend creating a `tizen` folder inside your project directory to house the Tizen project files. Run the **Tizen Action**: `+ Create Project` -> **Web** -> **TV-Samsung** -> **Blank Project**, and name it `tizen`. You should be able to **Run Project**, which will launch a blank page on your TV!

### Hosted TV App

A recommended approach is a **hosted TV app**, where your entire application is hosted at a public URL, and the `index.html` file simply redirects to your hosted version. You can add `<meta http-equiv="refresh" content="0; url=https://example.com">` to the html to do a redirect.

### Deployed TV App

For a fully deployed app, we're going to build our Lightning app and then put it into the tizen folder. Here is the vite build script I use for tizen
`"build:tizen": "vite build --sourcemap=false --base=./ --outDir tizen --emptyOutDir false",`

This will build all the files and place them in the tizen folder (which should be a subfolder of your Lightning project). Once your app is built via vite, you can package your app using the Tizen tools. Right click on the tizen folder and select `Tizen: Run Project` which should package and run the application on your target TV device.

Here is a sample config.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<widget xmlns="http://www.w3.org/ns/widgets" xmlns:tizen="http://tizen.org/ns/widgets" id="http://yourdomain/Template01" version="0.2.1" viewmodes="maximized">
   <name>Solid Demo App</name>
   <icon src="icon.png"></icon>
   <content src="index.html"></content>
   <feature name="http://tizen.org/feature/screen.size.normal.1080.1920"></feature>
   <tizen:setting screen-orientation="landscape" context-menu="enable" background-support="disable" encryption="disable" install-location="auto" hwkey-event="enable"></tizen:setting>
   <tizen:application id="bOtIKaCrZa.tizen" package="bOtIKaCrZa" required_version="2.3"></tizen:application>
   <tizen:privilege name="http://tizen.org/privilege/application.launch"></tizen:privilege>
   <tizen:metadata key="http://samsung.com/tv/metadata/prelaunch.support" value="true"></tizen:metadata>
   <tizen:metadata key="http://tizen.org/metadata/app_ui_type/base_screen_resolution" value="extensive"></tizen:metadata>
   <tizen:content-security-policy>
   default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  object-src 'none';
  connect-src 'self' https://api.themoviedb.org/3/;
   </tizen:content-security-policy>
   <tizen:profile name="tv"></tizen:profile>
</widget>
```

Make sure you have an acceptable CSP policy to make sure you can access the API otherwise it will be blocked.

## Debugging Tizen Apps

There is a **Debug Project** action available, which runs the app on a target device and launches your browser for debugging. However, older Tizen devices may have issues. In such cases, you may need an older browser version, available here: [Brave Browser v1.2.42](https://github.com/brave/brave-browser/releases/tag/v1.2.42). Note that it auto-updates, so you may need to reinstall often.

### Debugging Steps

1. Launch the debug app—it will open your default browser with a URL.
2. If the page is blank, right-click, select **View Source**, and copy the URL from that page.
3. Paste the copied URL into the Brave browser, which should launch the inspector for debugging.

## Support Links

- **Tizen Web Applications**: [https://docs.tizen.org/application/web/](https://docs.tizen.org/application/web/)
- **VS Code Extension**: [https://marketplace.visualstudio.com/items?itemName=tizen.vscode-tizen-csharp](https://marketplace.visualstudio.com/items?itemName=tizen.vscode-tizen-csharp)
- **Brave Browser (older version)**: [https://github.com/brave/brave-browser/releases/tag/v1.2.42](https://github.com/brave/brave-browser/releases/tag/v1.2.42)
- **Samsung Developer Forum**: [https://forum.developer.samsung.com/](https://forum.developer.samsung.com/)
