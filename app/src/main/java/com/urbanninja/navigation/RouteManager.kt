package com.urbanninja.navigation

import android.graphics.Color
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.osmdroid.bonuspack.routing.OSRMRoadManager
import org.osmdroid.bonuspack.routing.Road
import org.osmdroid.bonuspack.routing.RoadManager
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.overlay.Polyline

class RouteManager {

    private val roadManager: OSRMRoadManager = OSRMRoadManager(null, "UrbanNinja").apply {
        setMean(OSRMRoadManager.MEAN_BY_CAR)
    }

    /**
     * Calculates a route between two GeoPoints and returns a Polyline overlay
     * This function runs on a background thread using coroutines
     *
     * @param start Starting point of the route
     * @param end Ending point of the route
     * @return Polyline overlay ready to be added to map, or null if routing failed
     */
    suspend fun getRoute(start: GeoPoint, end: GeoPoint): Polyline? {
        return withContext(Dispatchers.IO) {
            try {
                // Create waypoints array
                val waypoints = ArrayList<GeoPoint>()
                waypoints.add(start)
                waypoints.add(end)

                // Get the road from OSRM
                val road: Road = roadManager.getRoad(waypoints)

                // Check if route was found
                if (road.mStatus != Road.STATUS_OK) {
                    return@withContext null
                }

                // Convert road to polyline
                val routePolyline = RoadManager.buildRoadOverlay(road)

                // Style the polyline
                routePolyline.apply {
                    outlinePaint.apply {
                        color = Color.BLUE
                        strokeWidth = 8f
                        style = android.graphics.Paint.Style.STROKE
                        strokeCap = android.graphics.Paint.Cap.ROUND
                        strokeJoin = android.graphics.Paint.Join.ROUND
                    }
                    // Add a subtle glow effect
                    outlinePaint.setShadowLayer(4f, 0f, 0f, Color.BLUE)
                }

                routePolyline
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }
    }
}
