import ENV from './env.public.json';

export default {
  name: "juken-re",
  slug: "juken-re",
  userInterfaceStyle: "automatic",
  platforms: ["ios", "android", "web"],
  version: "10.0.1",
  orientation: "portrait",
  icon: "./assets/wk4.png",
  plugins: [
    ["expo-build-properties", {
      android: {
        compileSdkVersion: 37,
        targetSdkVersion: 37,
      },
    }],
    ["expo-splash-screen", {
      image: "./assets/wksplash4.png",
      resizeMode: "contain",
      backgroundColor: "#1ecbe1",
    }],
  ],
  ios: {
    icon: "./assets/wk4sq.png",
    supportsTablet: true,
    bundleIdentifier: ENV.BUNDLE_ID,
    buildNumber: String(ENV.BUILD_VERSION),
  },
  android: {
    package: ENV.PACKAGE,
    icon: "./assets/android/launcher.png",
    adaptiveIcon: {
      foregroundImage: "./assets/android/foreground.png",
      monochromeImage: "./assets/android/monochrome.png",
      backgroundColor: "#006B5A",
    },
    versionCode: ENV.BUILD_VERSION,
    permissions: ["android.permission.VIBRATE"],
  },
  web: {
    bundler: "metro",
  },
};
