import { ContextWrapper } from "../ContextWrapper.tsx";
import { Help } from "./Components/Help.tsx";
import { Changelog } from "./Components/Changelog.tsx";
import OBR from "@owlbear-rodeo/sdk";
import { modalId } from "../../helper/variables.ts";
import { Settings } from "./Components/Settings.tsx";
import { DiceLogin } from "./Components/DiceLogin.tsx";
import { DiceCanvas } from "../general/DiceRoller/DiceCanvas.tsx";

export const Modal = () => {
    const content = new URLSearchParams(window.location.search).get("content") ?? null;

    return content === "dicetray" ? (
        <DiceCanvas />
    ) : (
        <ContextWrapper component={"modal"}>
            <Content />
        </ContextWrapper>
    );
};

const Content = () => {
    const content = new URLSearchParams(window.location.search).get("content") ?? null;

    const getContent = () => {
        if (content === "help") {
            return <Help />;
        } else if (content === "changelog") {
            return <Changelog />;
        } else if (content === "settings") {
            return <Settings />;
        } else if (content === "dddice") {
            return <DiceLogin />;
        } else {
            OBR.modal.close(modalId);
        }

        return <></>;
    };

    return <div className={"modal-wrapper"}>{getContent()}</div>;
};
