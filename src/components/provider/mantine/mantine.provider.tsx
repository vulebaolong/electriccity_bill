import { createTheme, MantineProvider as MantineProviderRoot } from "@mantine/core";
import { emotionTransform, MantineEmotionProvider } from "@mantine/emotion";
import { ReactNode } from "react";
import { RootStyleRegistry } from "./EmotionRootStyleRegistry";

const theme = createTheme({
    // components: {
    //     Button: { defaultProps: { size: "compact-sm" } },
    //     TextInput: { defaultProps: { size: "xs" } },
    //     Textarea: { defaultProps: { size: "xs" } },
    //     PasswordInput: { defaultProps: { size: "xs" } },
    //     Select: { defaultProps: { size: "xs" } },
    //     NumberInput: { defaultProps: { size: "xs" } },
    //     PinInput: { defaultProps: { size: "xs" } },
    //     Anchor: { defaultProps: { size: "xs" } },
    // },
});

export default function MantineProvider({ children }: { children: ReactNode }) {
    return (
        <RootStyleRegistry>
            <MantineEmotionProvider>
                <MantineProviderRoot theme={theme} stylesTransform={emotionTransform} defaultColorScheme="dark">
                    {children}
                </MantineProviderRoot>
            </MantineEmotionProvider>
        </RootStyleRegistry>
    );
}
