import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";

const unpatches = [];

export default {
  onLoad() {
    // Method 1: stub the idle timer that schedules the kick
    const timerMod = findByProps("startIdleTimer", "clearIdleTimer");
    if (timerMod?.startIdleTimer) {
      unpatches.push(instead(timerMod, "startIdleTimer", () => {}));
    }

    // Method 2: stub the idle callback handler
    const idleMod =
      findByProps("onCallIdle") ?? findByProps("handleCallIdle");
    if (idleMod?.onCallIdle) {
      unpatches.push(instead(idleMod, "onCallIdle", () => {}));
    } else if (idleMod?.handleCallIdle) {
      unpatches.push(instead(idleMod, "handleCallIdle", () => {}));
    }

    // Method 3: intercept the Flux dispatcher as a fallback
    const Dispatcher = findByProps("dispatch", "register", "wait");
    if (Dispatcher) {
      unpatches.push(
        instead(Dispatcher, "dispatch", ([action], orig) => {
          if (
            action?.type === "CALL_IDLE_DISCONNECT" ||
            (action?.type === "CALL_DELETE" && action?.reason === "idle")
          ) {
            return; // swallow the action
          }
          return orig(action);
        })
      );
    }
  },

  onUnload() {
    unpatches.forEach(fn => fn?.());
    unpatches.length = 0;
  }
};
