# 🔥 Integrating Firebolt SDK with SolidJS Lightning

## 📌 Overview

Firebolt is a standardized API framework for **RDK-based** devices, providing access to lifecycle management, device information, localization, and account services. **SolidJS Lightning** is a modern, reactive framework for building **TV applications** with optimized rendering and animation.

This guide walks through integrating **Firebolt SDK** into a **Solid Lightning** project.

---

## 🚀 Prerequisites

### ✅ Install Dependencies

Ensure you have a **SolidJS Lightning** project set up. If not, create one using:

```sh
npx degit lightning-tv/solid-starter-template my-solid-lightning-app
cd my-solid-lightning-app
npm install
npm run dev
```

Then, install the **Firebolt SDK**:

```sh
npm install @firebolt-js/sdk
```

---

## 🔄 Firebolt Integration with Solid Lightning

### 1️⃣ **Access Firebolt APIs in SolidJS Lightning Components**

Firebolt provides multiple APIs like **Lifecycle, Device, Account, and Localization**. You can call these APIs inside SolidJS reactive components.

**Example: Fetching Device Information**

```tsx
import { createSignal, createEffect } from 'solid-js';
import { Device } from '@firebolt-js/sdk';

export default function DeviceInfo() {
  const [deviceMake, setDeviceMake] = createSignal('Fetching...');

  Device.make()
    .then(setDeviceMake)
    .catch(() => setDeviceMake('Error retrieving device info'));

  return (
    <View>
      <Text x={100} y={100} size={40}>
        Device Make: {deviceMake()}
      </Text>
    </View>
  );
}
```

---

### 2️⃣ **Handling Lifecycle Events**

Firebolt’s `Lifecycle` API provides app states like **foreground, background, suspended, and resumed**. We can listen for these changes using **createEffect**.

**Example: Handling App Lifecycle**

```tsx
import { createSignal, createEffect } from 'solid-js';
import { Lifecycle } from '@firebolt-js/sdk';

export default function AppLifecycle() {
  const [state, setState] = createSignal('Initializing...');

  setState(Lifecycle.state());
  Lifecycle.on('statechange', (newState) => {
    setState(newState);
  });

  return (
    <View>
      <Text x={100} y={100} size={40}>
        App State: {state()}
      </Text>
    </View>
  );
}
```

---

### 3️⃣ **Retrieving User Account Information**

Firebolt allows retrieving **user account IDs** for personalization.

**Example: Displaying Account ID**

```tsx
import { createSignal, createEffect } from 'solid-js';
import { Account } from '@firebolt-js/sdk';

export default function UserAccount() {
  const [accountId, setAccountId] = createSignal('Loading...');

  Account.id()
    .then(setAccountId)
    .catch(() => setAccountId('Error retrieving account ID'));

  return (
    <View>
      <Text x={100} y={100} size={40}>
        Account ID: {accountId()}
      </Text>
    </View>
  );
}
```

---

### 4️⃣ **Using Localization APIs**

Firebolt provides geolocation data via the `Localization.latlon()` API.

**Example: Fetching Latitude & Longitude**

```tsx
import { createSignal, createEffect } from 'solid-js';
import { Localization } from '@firebolt-js/sdk';

export default function LocationInfo() {
  const [location, setLocation] = createSignal('Fetching...');

  Localization.latlon()
    .then(([lat, lon]) => setLocation(`Lat: ${lat}, Lon: ${lon}`))
    .catch(() => setLocation('Error retrieving location'));

  return (
    <View>
      <Text x={100} y={100} size={40}>
        {location()}
      </Text>
    </View>
  );
}
```

---

## 📖 Additional Resources

- 🔗 **Solid Firebolt Demo**: [SolidJS Firebolt Demo](https://lightning-tv.github.io/solid-demo-app/#/firebolt)
- 🔗 **Firebolt API Docs**: [RDK Firebolt API](https://rdkcentral.github.io/firebolt/apis/)
- 🔗 **Firebolt on GitHub**: [Firebolt SDK](https://github.com/rdkcentral/firebolt)

🚀 **Now you’re ready to build high-performance TV apps with Firebolt & Solid Lightning!** 🎉
