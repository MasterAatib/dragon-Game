import * as mc from "@minecraft/server";

const Mobs = [
  {
    id: "s3xta:tryple_stryke",
    tag: "tryple_stryke"
  },
  {
    id: "s3xta:night_fury",
    tag: "night_fury"
  }
];

function removeItem(player) {
  const inv = player.getComponent("inventory").container;
  for (let i = 0; i < inv.size; i++) {
    const slot = inv.getItem(i);
    if (slot && slot.typeId === "s3xta:dragon_fire") {
      inv.setItem(i, null);
    }
  }
}

mc.system.runInterval(() => {
  for (const player of mc.world.getPlayers()) {
    const riding = player.getComponent("minecraft:riding")?.entityRidingOn;

    if (riding) {
      const mobData = Mobs.find(m => {
        if (m.id !== riding.typeId) return false;
        if (m.variant === undefined) return true;
        const variant = riding.getProperty("wesl3y:variant") ?? 0;
        return m.variant === variant;
      });

      if (mobData && !player.hasTag(mobData.tag)) {
        player.addTag(mobData.tag);
        player.runCommand(`give @s s3xta:dragon_fire 1 0 {"minecraft:keep_on_death":{},"item_lock":{"mode":"lock_in_slot"}}`);
      }
    } else {
      for (const mobData of Mobs) {
        if (player.hasTag(mobData.tag)) {
          player.removeTag(mobData.tag);
          removeItem(player, "s3xta:dragon_fire");
        }
      }
    }
  }
}, 5);