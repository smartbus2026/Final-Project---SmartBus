import { Request, Response } from "express";
import Route from "../models/Route";
import Stop from "../models/stop";
import Notification from "../models/notification";
import User from "../models/User";
import { getIO } from "../socket";

// ── Helper: bulk-create notifications for all students + socket broadcast ──────
async function broadcastNewRouteAlert(routeName: string) {
  try {
    const students = await User.find({ role: "student" }).select("_id").lean();
    if (!students.length) return;

    const title = "🚌 New Route Alert";
    const message = `A new bus route "${routeName}" has just been added! Check it out and book your seat.`;
    const now = new Date();

    // Bulk-insert one notification per student
    const docs = students.map((s) => ({
      user: s._id,
      title,
      message,
      type: "general",
      read: false,
      createdAt: now,
    }));
    // Bulk-insert one notification per student (capture returned docs for real _ids)
    const savedNotifs = await Notification.insertMany(docs);

    // Emit real-time event to each student's personal socket room (include real _id)
    const io = getIO();
    savedNotifs.forEach((notif: any, i: number) => {
      io.to(`user:${students[i]._id}`).emit("new_notification", {
        _id: notif._id.toString(),
        title: notif.title,
        message: notif.message,
        type: notif.type,
        read: false,
        createdAt: notif.createdAt ?? now,
      });
    });

    console.log(`[Route] Broadcasted new-route notification to ${students.length} student(s).`);
  } catch (err) {
    console.error("[Route] broadcastNewRouteAlert error:", err);
  }
}

export const createRoute = async (req: Request, res: Response) => {
  try {
    const { name, distance, duration, stops } = req.body;

    const stopIds = [];
    if (stops && Array.isArray(stops)) {
      for (const stopName of stops) {
        let stop = await Stop.findOne({ name: stopName });
        if (!stop) {
          stop = await Stop.create({ name: stopName, location: { lat: 0, lng: 0 } });
        }
        stopIds.push(stop._id);
      }
    }

    const newRoute = await Route.create({ name, distance, duration, stops: stopIds });

    // Fire-and-forget: notify all students in the background
    broadcastNewRouteAlert(newRoute.name);

    res.status(201).json(newRoute);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllRoutes = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = { name: { $regex: search, $options: "i" } };
    }

    const routes = await Route.find(query).populate("stops");
    res.status(200).json({
      results: routes.length,
      data: routes,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateRoute = async (req: Request, res: Response) => {
  try {
    const updatedRoute = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedRoute);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteRoute = async (req: Request, res: Response) => {
  try {
    await Route.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Route deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const addStopToRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Route ID
    const { stop_name, lat, lng } = req.body;

    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({ message: "Route not found!" });
    }

    let stop = await Stop.findOne({ name: stop_name });

    if (!stop) {
      stop = await Stop.create({
        name: stop_name,
        location: { lat, lng },
      });
    }

    if (route.stops.includes(stop._id as any)) {
      return res.status(400).json({ message: "Stop already exists in this route" });
    }

    route.stops.push(stop._id as any);
    await route.save();

    const updatedRoute = await Route.findById(id).populate("stops");

    res.status(201).json({ 
      message: "Stop added to route successfully",
      route: updatedRoute, 
      stop 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const removeStopFromRoute = async (req: Request, res: Response) => {
  try {
    const { routeId, stopId } = req.params;
    
    const route = await Route.findByIdAndUpdate(
      routeId,
      { $pull: { stops: stopId as any } },
      { returnDocument: 'after' }
    );
    
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    await Stop.findByIdAndDelete(stopId);

    res.status(200).json({ message: "Stop removed from route and deleted successfully", route });
  } catch (error: any) {
    console.error("--- DELETE STOP ERROR ---", error);
    res.status(500).json({ message: error.message || "Failed to delete stop." });
  }
};