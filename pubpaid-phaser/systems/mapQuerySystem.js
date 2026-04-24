import { PUBPAID_SCENE_MAP, isPointInsideRect, isPointWalkable } from "../config/sceneMap.js";

export function getSceneMap(sceneId) {
  return PUBPAID_SCENE_MAP[sceneId] || null;
}

export function getAreasByType(sceneId, type) {
  const sceneMap = getSceneMap(sceneId);
  return (sceneMap?.semanticAreas || []).filter((area) => area.type === type);
}

export function getAreaById(sceneId, areaId) {
  const sceneMap = getSceneMap(sceneId);
  return (sceneMap?.semanticAreas || []).find((area) => area.id === areaId) || null;
}

export function isWalkable(sceneId, x, y) {
  const sceneMap = getSceneMap(sceneId);
  return sceneMap ? isPointWalkable(sceneMap, x, y) : false;
}

export function getInteractionAt(sceneId, x, y) {
  const sceneMap = getSceneMap(sceneId);
  if (!sceneMap) return null;

  return (sceneMap.interactionPoints || []).find((point) => {
    const hasBox = Number.isFinite(point.width) && Number.isFinite(point.height);
    if (hasBox) {
      const rect = {
        x: point.x - point.width / 2,
        y: point.y - point.height / 2,
        width: point.width,
        height: point.height
      };
      if (isPointInsideRect(x, y, rect)) return true;
    }
    const radius = point.radius || 0;
    return radius > 0 && Phaser.Math.Distance.Between(x, y, point.x, point.y) <= radius;
  }) || null;
}

export function getInteractionById(sceneId, pointId) {
  const sceneMap = getSceneMap(sceneId);
  return (sceneMap?.interactionPoints || []).find((point) => point.id === pointId) || null;
}

export function getNearestInteraction(sceneId, x, y, types = []) {
  const sceneMap = getSceneMap(sceneId);
  if (!sceneMap) return null;

  const allowedTypes = Array.isArray(types) ? types : [types];
  return (sceneMap.interactionPoints || [])
    .filter((point) => !allowedTypes.length || allowedTypes.includes(point.type))
    .map((point) => ({
      point,
      distance: Phaser.Math.Distance.Between(x, y, point.x, point.y)
    }))
    .sort((a, b) => a.distance - b.distance)[0] || null;
}

export function getTransition(sceneId, transitionId) {
  const sceneMap = getSceneMap(sceneId);
  return (sceneMap?.transitionPoints || []).find((transition) => transition.id === transitionId) || null;
}

