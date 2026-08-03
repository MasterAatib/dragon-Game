import * as mc from "@minecraft/server";
import "./mount.js";

const Dragons = {
  "s3xta:tryple_stryke": {
    anim: "animation.tryple_stryke.fire",
    comecofogo: 0.5,
    terminafogo: 2.0,
    terminatudo: 2.0,
    offsetFly: [0, 2.5, 2],
    offsetWalk: [0, 2.5, 2]
  }
};

mc.world.afterEvents.playerButtonInput.subscribe((event) => {
  if (event.newButtonState === mc.ButtonState.Released) return;

  const player = event.player;
  const mount = player.getComponent("minecraft:riding")?.entityRidingOn;
  if (!mount) return;

  const isTamed = mount.getComponent("minecraft:is_saddled");
  const isFlying = mount.getProperty("s3xta:flying");

  if (event.button === mc.InputButton.Jump) {
    if (!isTamed) return;
    
    if (isFlying == false && !mount.isOnGround) {
      mc.system.run(() => {
        console.warn("fly3");
        mount.triggerEvent("s3xta:ride_flying");
      });
    }
  }
});


mc.world.afterEvents.itemStartUse.subscribe(event => {
  const player = event.source;
  const item = event.itemStack;
  if (!player || !item) return;
  if (item.typeId !== "s3xta:dragon_fire") return;

  const mount = player.getComponent("minecraft:riding")?.entityRidingOn;
  if (!mount) return;

  const config = Dragons[mount.typeId];
  if (!config) return; // não é dragão da lista

  fogo(
    mount,
    player,
    false,
    config.anim,
    config.comecofogo,
    config.terminafogo,
    config.terminatudo,
    config.offsetFly,
    config.offsetWalk
  );
});

mc.system.afterEvents.scriptEventReceive.subscribe(event => {
  if (!event.id.startsWith("s3xta:")) return;

  const key = event.id.replace("s3xta:", "");   // ex: "tryple_stryke_special"
  if (!key.endsWith("_special")) return;

  const baseId = key.replace("_special", "");    // ex: "tryple_stryke"
  const entity = event.sourceEntity;
  if (!entity) return;

  // monta o ID completo do dragão
  const dragonId = "s3xta:" + baseId;

  const data = Dragons[dragonId];
  if (!data) return; // dragão não existe no schema

  // chama fogo usando os dados do schema
  fogo(
    entity,
    entity,
    true,
    data.anim,
    data.comecofogo,
    data.terminafogo,
    data.terminatudo,
    data.offsetFly,
    data.offsetWalk
  );
});


function fogo(entity, player, event, anim, comecofogo, terminafogo, terminatudo, offset1, offset2) {
  entity.playAnimation(anim);
  
  let test;
  mc.system.runTimeout(() => {
    test = mc.system.runInterval(() => {
      const view = player.getViewDirection();
      const velocity = getSpeed(entity.getVelocity());
      const loc = entity.getProperty('s3xta:flying') == true ? offset1 : offset2;
      const ofs = offsetPower(entity.location, entity.getRotation(), loc);
      
      const projectile = entity.dimension.spawnEntity("s3xta:fogo", ofs);
    
      const comp = projectile.getComponent("projectile");

      if (comp) {
        comp.owner = entity;
        comp.shoot({
          x: view.x * 2,
          y: view.y * 2,
          z: view.z * 2
        });
      }
      
    }, 0.3 * 20);
  }, comecofogo * 20);
  
  mc.system.runTimeout(() => {
    mc.system.clearRun(test);
  }, terminafogo * 20);
  
  mc.system.runTimeout(() => {
    if (event) entity.triggerEvent("s3xta:melee");
  }, terminatudo * 20);
}


function getSpeed(velocity) {
  return Math.sqrt(velocity.x**2 + velocity.y**2 + velocity.z**2);
}

export function offsetPower(location, rotation, offset) {
    function round100000(number) {
        return Math.round(100000*number)/100000;
    }

    // Yaw (rotação horizontal)
    const yaw = rotation.y * (Math.PI/180);

    // Vetores baseados só no yaw
    const x_positionX = -round100000(Math.sin(yaw));
    const x_positionZ = round100000(Math.cos(yaw));

    const z_positionX = -round100000(Math.sin(yaw));
    const z_positionZ = round100000(Math.cos(yaw));

    // Y fixo (vertical sem influência do pitch)
    const y_positionY = 1;

    return {
        x: location.x + x_positionX * offset[0] + z_positionX * offset[2],
        y: location.y + offset[1], // só altura, sem pitch
        z: location.z + x_positionZ * offset[0] + z_positionZ * offset[2]
    };
}

export function offsetPower2(location, rotation, offset) {
    function round100000(number) {
        return Math.round(100000*number)/100000;
    }
    const x_entityRotationY = (rotation.y + 90) * (Math.PI/180);
    const x_positionX = -round100000(Math.sin(x_entityRotationY));
    const x_positionZ = round100000(Math.cos(x_entityRotationY));
    
    const z_entityRotationY = rotation.y * (Math.PI/180);
    const z_entityRotationX = rotation.x * (Math.PI/180);
    const z_positionX = -round100000(Math.sin(z_entityRotationY)*Math.cos(z_entityRotationX));
    const z_positionZ = round100000(Math.cos(z_entityRotationY)*Math.cos(z_entityRotationX));
    const z_positionY = -round100000(Math.sin(z_entityRotationX));
    
    const y_entityRotationY = rotation.y * (Math.PI/180);
    const y_entityRotationX = rotation.x * (Math.PI/180);
    const y_positionX = -round100000(Math.sin(y_entityRotationY)*Math.sin(y_entityRotationX));
    const y_positionZ = round100000(Math.cos(y_entityRotationY)*Math.sin(y_entityRotationX));
    const y_positionY = round100000(Math.cos(y_entityRotationX));

    return {
        x:location.x + x_positionX*offset[0] + y_positionX*offset[1] + z_positionX*offset[2],
        y:location.y + z_positionY*offset[2] + y_positionY*offset[1],
        z:location.z + x_positionZ*offset[0] + y_positionZ*offset[1] + z_positionZ*offset[2]
    }
}