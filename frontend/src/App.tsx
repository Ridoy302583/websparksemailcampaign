// App.tsx
import { RouterProvider } from "react-router";
import { Flowbite, ThemeModeScript } from 'flowbite-react';
import router from "./routes/Router";
import { AuthProvider } from "./contexts/AuthContext";
import customTheme from "./utils/theme/custom-theme";

function App() {
  return (
    <>
      <ThemeModeScript />
      <AuthProvider>
        <Flowbite theme={{ theme: customTheme }}>
          <RouterProvider router={router} />
        </Flowbite>
      </AuthProvider>
    </>
  );
}

export default App;
