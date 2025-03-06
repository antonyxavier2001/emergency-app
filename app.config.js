import "dotenv/config";

export default {
  expo: {
    name: "ClearLane",
    slug: "ClearLane",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/appicon.jpg",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_API_KEY,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_API_KEY,
        },
      },
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash.jpg",
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          imageWidth: 200,
          imageHeight: 200,
        },
      ],
      "expo-font",
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_API_KEY,
    },
  },
};
