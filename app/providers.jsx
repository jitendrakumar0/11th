"use client";

import * as React from "react";
import { useRouter } from 'next/navigation'
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { FirebaseProvider } from "@/app/context/Firebase";
import UiLayout from "@/app/uiLayout";
import { SidebarAndNavbarToggleProvider } from "@/app/context/SidebarAndNavbarToggle";
import { AuthProvider } from "@/app/context/Authentications";
import { Toaster } from "sonner";
import MainLoading from "@/components/mainLoading";
import { NextUIProvider } from "@nextui-org/react";

export function Providers({ children, themeProps }) {
	const router = useRouter();

	return (
		<FirebaseProvider>
			<AuthProvider>
				<NextUIProvider validationBehavior="native" navigate={router.push}>
					<NextThemesProvider {...themeProps}>
						<SidebarAndNavbarToggleProvider>
							<Toaster richColors expand={false} position="bottom-left" />
							<MainLoading />
							<UiLayout>
								{children}
							</UiLayout>
						</SidebarAndNavbarToggleProvider>
					</NextThemesProvider>
				</NextUIProvider>
			</AuthProvider>
		</FirebaseProvider>
	);
}
