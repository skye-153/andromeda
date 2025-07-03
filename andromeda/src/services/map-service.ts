'use server';

import { MapData, Node, Connection } from '@/lib/types';
import dbPromise from '@/lib/mongodb';
const mongoose = require('mongoose');
const MapModel = require('@/models/Map');
const NodeModel = require('@/models/Node');
const ConnectionModel = require('@/models/Connection');
const FileModel = require('@/models/File');

// TODO: Refactor this file to use Mongoose models for all CRUD operations instead of in-memory storage. Remove the in-memory 'maps' array and implement all functions using MongoDB/Mongoose. Export getMaps, createMap, getMap, updateMap, deleteMap, and renameMap as async functions that interact with the database.

// TODO: Implement this function using the Map Mongoose model
export async function getMaps(): Promise<{ id: string, name: string }[]> {
  await dbPromise;
  const maps = await MapModel.find({}, { name: 1 }).lean();
  return maps.map((map: any) => ({ id: map._id.toString(), name: map.name }));
}

// TODO: Implement this function using the Map Mongoose model
export async function createMap(name: string): Promise<{ id: string, name: string }> {
  await dbPromise;
  const newMap = await MapModel.create({ name, nodes: [], connections: [] });
  return { id: newMap._id.toString(), name: newMap.name };
}

// TODO: Implement this function using the Map Mongoose model
export async function getMap(id: string): Promise<any | null> {
  await dbPromise;
  const map = await MapModel.findById(id)
    .populate({ path: 'nodes', model: NodeModel, populate: { path: 'files', model: FileModel } })
    .populate({ path: 'connections', model: ConnectionModel })
    .lean();
  if (!map) return null;
  map.id = map._id.toString();
  return map;
}

// TODO: Implement this function using the Map, Node, and Connection Mongoose models
export async function updateMap({ id, nodes, connections }: { id: string, nodes: any[], connections: any[] }): Promise<void> {
  await dbPromise;
  // Update nodes
  const nodeIds = [];
  for (const node of nodes) {
    let dbNode;
    if (node._id) {
      dbNode = await NodeModel.findByIdAndUpdate(node._id, node, { new: true });
    } else {
      dbNode = await NodeModel.create(node);
    }
    nodeIds.push(dbNode._id);
  }
  // Remove nodes not in the update
  await NodeModel.deleteMany({ _id: { $in: (await MapModel.findById(id)).nodes, $nin: nodeIds } });

  // Update connections
  const connectionIds = [];
  for (const connection of connections) {
    let dbConnection;
    if (connection._id) {
      dbConnection = await ConnectionModel.findByIdAndUpdate(connection._id, connection, { new: true });
    } else {
      dbConnection = await ConnectionModel.create(connection);
    }
    connectionIds.push(dbConnection._id);
  }
  // Remove connections not in the update
  await ConnectionModel.deleteMany({ _id: { $in: (await MapModel.findById(id)).connections, $nin: connectionIds } });

  // Update the map document
  await MapModel.findByIdAndUpdate(id, { nodes: nodeIds, connections: connectionIds });
}

// TODO: Implement this function using the Map Mongoose model
export async function deleteMap(id: string): Promise<void> {
  await dbPromise;
  const map = await MapModel.findById(id);
  if (!map) return;
  // Delete all nodes and connections
  await NodeModel.deleteMany({ _id: { $in: map.nodes } });
  await ConnectionModel.deleteMany({ _id: { $in: map.connections } });
  await MapModel.findByIdAndDelete(id);
}

// TODO: Implement this function using the Map Mongoose model
export async function renameMap(id: string, newName: string): Promise<any | null> {
  await dbPromise;
  const updatedMap = await MapModel.findByIdAndUpdate(id, { name: newName }, { new: true });
  if (!updatedMap) return null;
  return { id: updatedMap._id.toString(), name: updatedMap.name };
}
