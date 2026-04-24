import { GAME_HEIGHT, GAME_WIDTH } from "./gameConfig.js";

export const STREET_SCENE_MAP = {
  id: "street",
  label: "Rua / Exterior",
  spawn: { x: 176, y: 560 },
  semanticAreas: [
    {
      id: "street_road_main",
      label: "Rua",
      type: "walkable",
      shape: "rect",
      x: 0,
      y: 458,
      width: GAME_WIDTH,
      height: 214,
      notes: "Faixa principal da estrada. Comentario do usuario: isso e rua."
    },
    {
      id: "street_sidewalk_pub_front",
      label: "Calcada frontal",
      type: "walkable",
      shape: "rect",
      x: 26,
      y: 362,
      width: 1128,
      height: 96,
      notes: "Calcada em frente ao pub e aos predios laterais."
    },
    {
      id: "street_bus_stop_zone",
      label: "Parada de onibus",
      type: "poi",
      shape: "rect",
      x: 972,
      y: 318,
      width: 208,
      height: 136,
      notes: "Marcado pelo usuario como ponto de onibus."
    },
    {
      id: "street_arcade_facade",
      label: "Fachada do arcade",
      type: "poi",
      shape: "rect",
      x: 46,
      y: 108,
      width: 284,
      height: 310,
      notes: "Predio lateral esquerdo com letreiro de arcade."
    },
    {
      id: "street_pub_frontage",
      label: "Fachada PubPaid",
      type: "poi",
      shape: "rect",
      x: 330,
      y: 84,
      width: 570,
      height: 372,
      notes: "Volume frontal do pub."
    },
    {
      id: "street_pub_sign_light_zone",
      label: "Luz da fachada",
      type: "fx",
      shape: "rect",
      x: 454,
      y: 104,
      width: 340,
      height: 172,
      notes: "Area marcada pelo usuario para receber efeito de luz forte na placa/fachada."
    },
    {
      id: "street_city_backlight_zone",
      label: "Cidade ao fundo",
      type: "fx",
      shape: "rect",
      x: 0,
      y: 0,
      width: GAME_WIDTH,
      height: 238,
      notes: "Area traseira do mapa com luzes piscando para dar vida a cidade."
    },
    {
      id: "street_alley_dark_light_zone",
      label: "Beco lateral",
      type: "fx",
      shape: "rect",
      x: 274,
      y: 230,
      width: 94,
      height: 196,
      notes: "Beco lateral esquerdo; precisa de luz escura para leitura do espaço."
    }
  ],
  walkableZones: [
    {
      id: "street_walkable_main",
      shape: "rect",
      x: 34,
      y: 394,
      width: GAME_WIDTH - 68,
      height: 278
    }
  ],
  collisionZones: [
    {
      id: "street_pub_building_collision",
      shape: "rect",
      x: 360,
      y: 118,
      width: 516,
      height: 248
    },
    {
      id: "street_arcade_building_collision",
      shape: "rect",
      x: 58,
      y: 130,
      width: 238,
      height: 252
    },
    {
      id: "street_bus_stop_collision",
      shape: "rect",
      x: 995,
      y: 334,
      width: 160,
      height: 112
    }
  ],
  interactionPoints: [
    {
      id: "street_pub_door",
      label: "Porta principal",
      type: "transition",
      x: 674,
      y: 452,
      width: 224,
      height: 344,
      entryX: 674,
      entryY: 552,
      radius: 190,
      notes: "Comentario do usuario: isso e uma porta."
    },
    {
      id: "street_bus_stop_sign",
      label: "Parada de onibus",
      type: "poi",
      x: 1040,
      y: 350,
      width: 150,
      height: 118,
      radius: 72
    },
    {
      id: "street_arcade_entry",
      label: "Arcade lateral",
      type: "poi",
      x: 174,
      y: 252,
      width: 136,
      height: 154,
      radius: 64
    },
    {
      id: "street_bus_stop_dancer",
      label: "Mulher no ponto",
      type: "setpiece",
      x: 1026,
      y: 432,
      width: 116,
      height: 132,
      radius: 54
    },
    {
      id: "street_sleeping_homeless",
      label: "Morador dormindo",
      type: "setpiece",
      x: 458,
      y: 452,
      width: 168,
      height: 112,
      radius: 52
    },
    {
      id: "street_arcade_roof_cat",
      label: "Gato no telhado",
      type: "setpiece",
      x: 152,
      y: 118,
      width: 92,
      height: 72,
      radius: 36
    }
  ],
  transitionPoints: [
    {
      id: "street_to_interior_pub_door",
      fromScene: "street",
      toScene: "interior",
      ref: "street_pub_door"
    }
  ],
  propsMap: [
    { id: "street_prop_bus_shelter", areaId: "street_bus_stop_zone", kind: "shelter" },
    { id: "street_prop_bus_sign", areaId: "street_bus_stop_zone", kind: "sign" },
    { id: "street_prop_tree_right", areaId: "street_bus_stop_zone", kind: "tree" },
    { id: "street_prop_arcade_sign", areaId: "street_arcade_facade", kind: "neon-sign" },
    { id: "street_prop_pub_sign", areaId: "street_pub_frontage", kind: "main-sign" },
    { id: "street_prop_bus_stop_dancer", areaId: "street_bus_stop_zone", kind: "npc-idle" },
    { id: "street_prop_sleeping_homeless", areaId: "street_pub_frontage", kind: "npc-idle" },
    { id: "street_prop_arcade_roof_cat", areaId: "street_arcade_facade", kind: "animal-idle" },
    { id: "street_prop_city_lights", areaId: "street_city_backlight_zone", kind: "fx" },
    { id: "street_prop_alley_dark_light", areaId: "street_alley_dark_light_zone", kind: "fx" },
    { id: "street_prop_pub_sign_light", areaId: "street_pub_sign_light_zone", kind: "fx" }
  ]
};

export const INTERIOR_SCENE_MAP = {
  id: "interior",
  label: "Bar / Interior",
  spawn: { x: 640, y: 608 },
  semanticAreas: [
    {
      id: "interior_main_walkway",
      label: "Circulacao principal",
      type: "walkable",
      shape: "rect",
      x: 96,
      y: 146,
      width: GAME_WIDTH - 192,
      height: GAME_HEIGHT - 238,
      notes: "Faixa principal caminhavel do salao."
    },
    {
      id: "interior_bar_counter",
      label: "Balcao",
      type: "poi",
      shape: "rect",
      x: 80,
      y: 84,
      width: 404,
      height: 180
    },
    {
      id: "interior_arcade_zone",
      label: "Arcades",
      type: "poi",
      shape: "rect",
      x: 694,
      y: 42,
      width: 500,
      height: 292
    },
    {
      id: "interior_stage_zone",
      label: "Palco",
      type: "poi",
      shape: "rect",
      x: 926,
      y: 136,
      width: 236,
      height: 176
    },
    {
      id: "interior_exit_zone",
      label: "Saida para rua",
      type: "transition",
      shape: "rect",
      x: 558,
      y: 528,
      width: 164,
      height: 108
    }
  ],
  walkableZones: [
    {
      id: "interior_walkable_main",
      shape: "rect",
      x: 96,
      y: 146,
      width: GAME_WIDTH - 192,
      height: GAME_HEIGHT - 238
    }
  ],
  collisionZones: [
    {
      id: "interior_bar_counter_collision",
      shape: "rect",
      x: 84,
      y: 126,
      width: 364,
      height: 110
    },
    {
      id: "interior_arcade_wall_collision",
      shape: "rect",
      x: 704,
      y: 48,
      width: 494,
      height: 232
    },
    {
      id: "interior_stage_collision",
      shape: "rect",
      x: 944,
      y: 150,
      width: 196,
      height: 112
    }
  ],
  interactionPoints: [
    {
      id: "interior_waiter_hub",
      label: "Garcom / hub",
      type: "interaction",
      x: 306,
      y: 438,
      radius: 72
    },
    {
      id: "interior_stage_trigger",
      label: "Palco",
      type: "interaction",
      x: 1060,
      y: 242,
      radius: 84
    },
    {
      id: "interior_exit_to_street",
      label: "Saida",
      type: "transition",
      x: 640,
      y: 580,
      radius: 96
    }
  ],
  transitionPoints: [
    {
      id: "interior_to_street_exit",
      fromScene: "interior",
      toScene: "street",
      ref: "interior_exit_to_street"
    }
  ],
  propsMap: [
    { id: "interior_prop_counter", areaId: "interior_bar_counter", kind: "counter" },
    { id: "interior_prop_arcade_stack", areaId: "interior_arcade_zone", kind: "arcade" },
    { id: "interior_prop_stage", areaId: "interior_stage_zone", kind: "stage" }
  ]
};

export const PUBPAID_SCENE_MAP = {
  street: STREET_SCENE_MAP,
  interior: INTERIOR_SCENE_MAP
};

export function getInteractionPoint(sceneId, pointId) {
  return PUBPAID_SCENE_MAP[sceneId]?.interactionPoints?.find((point) => point.id === pointId) || null;
}

export function isPointInsideRect(x, y, rect) {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

export function isPointWalkable(sceneMap, x, y) {
  const inWalkable = (sceneMap.walkableZones || []).some((zone) => isPointInsideRect(x, y, zone));
  if (!inWalkable) return false;
  const blocked = (sceneMap.collisionZones || []).some((zone) => isPointInsideRect(x, y, zone));
  return !blocked;
}
