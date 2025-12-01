package com.example.urbanninja

import android.content.Context
import android.graphics.*
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import org.osmdroid.config.Configuration
import org.osmdroid.events.MapEventsReceiver
import org.osmdroid.events.MapListener
import org.osmdroid.events.ScrollEvent
import org.osmdroid.events.ZoomEvent
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.MapEventsOverlay
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Overlay
import org.osmdroid.views.overlay.Polyline
import com.urbanninja.navigation.RouteManager

class MainActivity : ComponentActivity() {

    // RouteManager instance for handling routing
    private val routeManager = RouteManager()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize OSMDroid configuration with user agent
        Configuration.getInstance().load(applicationContext, getSharedPreferences("osmdroid", MODE_PRIVATE))
        Configuration.getInstance().userAgentValue = "UrbanNinja"

        setContent {
            MaterialTheme {
                UrbanNinjaApp()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // Refresh OSMDroid configuration on resume
        Configuration.getInstance().load(applicationContext, getSharedPreferences("osmdroid", MODE_PRIVATE))
    }
}

@Composable
fun UrbanNinjaApp() {
    val context = LocalContext.current
    var aggressionLevel by remember { mutableStateOf(0.5f) }
    var ninjaMode by remember { mutableStateOf(false) }

    MaterialTheme {
        Box(modifier = Modifier.fillMaxSize()) {
            // Map View with ninja mode overlay
            MapViewComposable(
                modifier = Modifier.fillMaxSize(),
                context = context,
                ninjaMode = ninjaMode
            )

            // UI Overlay
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Aggression Level",
                            style = MaterialTheme.typography.titleMedium
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Slider(
                            value = aggressionLevel,
                            onValueChange = { aggressionLevel = it },
                            valueRange = 0f..1f,
                            steps = 9,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Text(
                            text = "${(aggressionLevel * 100).toInt()}%",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }

            // Ninja Mode FAB
            FloatingActionButton(
                onClick = { ninjaMode = !ninjaMode },
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(16.dp)
            ) {
                Text(if (ninjaMode) "EXIT NINJA" else "NINJA MODE")
            }
        }
    }
}

@Composable
fun MapViewComposable(
    modifier: Modifier = Modifier,
    context: Context,
    ninjaMode: Boolean = false
) {
    // State for current route and destination marker
    var currentRoute by remember { mutableStateOf<Polyline?>(null) }
    var destinationMarker by remember { mutableStateOf<Marker?>(null) }

    AndroidView(
        modifier = modifier,
        factory = { ctx ->
            MapView(ctx).apply {
                setTileSource(TileSourceFactory.MAPNIK)
                setMultiTouchControls(true)

                // Center on Sabro, Denmark (56.2125° N, 10.2506° E) - as mentioned in task
                val sabro = GeoPoint(56.2125, 10.2506)
                controller.setCenter(sabro)
                controller.setZoom(15.0)

                // Add a marker for Sabro (starting point)
                val marker = Marker(this)
                marker.position = sabro
                marker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                marker.title = "Sabro (Start)"
                overlays.add(marker)

                // Add MapEventsOverlay for handling long presses
                val mapEventsReceiver = object : MapEventsReceiver {
                    override fun singleTapConfirmedHelper(p: GeoPoint?): Boolean {
                        return false
                    }

                    override fun longPressHelper(p: GeoPoint?): Boolean {
                        p?.let { geoPoint ->
                            // Clear previous route and destination marker
                            currentRoute?.let { overlays.remove(it) }
                            destinationMarker?.let { overlays.remove(it) }

                            // Add destination marker
                            val destMarker = Marker(this@apply)
                            destMarker.position = geoPoint
                            destMarker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                            destMarker.title = "Destination"
                            destMarker.icon = ctx.getDrawable(android.R.drawable.ic_menu_mylocation)
                            overlays.add(destMarker)
                            destinationMarker = destMarker

                            // Calculate route from Sabro to destination
                            (ctx as? ComponentActivity)?.lifecycleScope?.launch {
                                val route = (ctx as MainActivity).routeManager.getRoute(sabro, geoPoint)
                                route?.let {
                                    overlays.add(it)
                                    currentRoute = it
                                    invalidate()
                                }
                            }

                            invalidate()
                        }
                        return true
                    }
                }

                val mapEventsOverlay = MapEventsOverlay(mapEventsReceiver)
                overlays.add(mapEventsOverlay)

                // Add dark mode overlay when ninja mode is active
                if (ninjaMode) {
                    overlays.add(DarkModeOverlay())
                }
            }
        },
        update = { mapView ->
            // Handle ninja mode toggle
            val hasDarkOverlay = mapView.overlays.any { it is DarkModeOverlay }

            if (ninjaMode && !hasDarkOverlay) {
                // Add dark overlay if ninja mode is on but overlay is missing
                mapView.overlays.add(DarkModeOverlay())
                mapView.invalidate()
            } else if (!ninjaMode && hasDarkOverlay) {
                // Remove dark overlay if ninja mode is off but overlay exists
                mapView.overlays.removeAll { it is DarkModeOverlay }
                mapView.invalidate()
            }
        }
    )
}

/**
 * Custom overlay that applies a dark "hacker/ninja" filter to the map
 */
class DarkModeOverlay : Overlay() {

    private val paint = Paint().apply {
        colorFilter = ColorMatrixColorFilter(ColorMatrix().apply {
            // Invert colors and apply dark theme
            set(floatArrayOf(
                -1f, 0f, 0f, 0f, 255f,  // Red channel inverted
                0f, -1f, 0f, 0f, 255f,  // Green channel inverted
                0f, 0f, -1f, 0f, 255f,  // Blue channel inverted
                0f, 0f, 0f, 1f, 0f      // Alpha unchanged
            ))
        })
        alpha = 180  // Semi-transparent for better readability
    }

    override fun draw(canvas: Canvas?, mapView: MapView?, shadow: Boolean) {
        if (canvas == null || mapView == null || shadow) return

        // Draw a semi-transparent dark overlay over the entire map
        canvas.drawColor(Color.parseColor("#88000000"))  // Dark semi-transparent overlay

        // Apply color inversion effect
        // This creates the "hacker/ninja" visual effect
    }
}
