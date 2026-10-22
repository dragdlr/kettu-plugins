const { findByProps } = vendetta.metro;
const { instead } = vendetta.patcher;

const unpatches = [];

export default {
  onLoad() {
    const timerMod = findByProps("startIdleTimer", "clearIdleTimer");
    if (timerMod?.startIdleTimer) {
      unpatches.push(instead(timerMod, "startIdleTimer", () => {}));
    }

    const idleMod =
      findByProps("onCallIdle") ?? findByProps("handleCallIdle");
    if (idleMod?.onCallIdle) {
      unpatches.push(instead(idleMod, "onCallIdle", () => {}));
    } else if (idleMod?.handleCallIdle) {
      unpatches.push(instead(idleMod, "handleCallIdle", () => {}));
    }

    const Dispatcher = findByProps("dispatch", "register", "wait");
    if (Dispatcher) {
      unpatches.push(
        instead(Dispatcher, "dispatch", ([action], orig) => {
          if (
            action?.type === "CALL_IDLE_DISCONNECT" ||
            (action?.type === "CALL_DELETE" && action?.reason === "idle")
          ) {
            return;
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
