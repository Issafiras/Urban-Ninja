package com.urbanninja.navigation

import android.content.Context
import android.os.Bundle
import android.preference.PreferenceManager
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
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize OSMDroid configuration
        Configuration.getInstance().load(
            applicationContext,
            PreferenceManager.getDefaultSharedPreferences(applicationContext)
        )

        setContent {
            UrbanNinjaApp()
        }
    }

    override fun onResume() {
        super.onResume()
        // Refresh OSMDroid configuration on resume
        Configuration.getInstance().load(
            applicationContext,
            PreferenceManager.getDefaultSharedPreferences(applicationContext)
        )
    }
}

@Composable
fun UrbanNinjaApp() {
    val context = LocalContext.current
    var aggressionLevel by remember { mutableStateOf(0.5f) }

    MaterialTheme {
        Box(modifier = Modifier.fillMaxSize()) {
            // Map View
            MapViewComposable(
                modifier = Modifier.fillMaxSize(),
                context = context
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
        }
    }
}

@Composable
fun MapViewComposable(
    modifier: Modifier = Modifier,
    context: Context
) {
    AndroidView(
        modifier = modifier,
        factory = { ctx ->
            MapView(ctx).apply {
                setTileSource(TileSourceFactory.MAPNIK)
                setMultiTouchControls(true)

                // Center on Aarhus, Denmark (56.1629° N, 10.2039° E)
                val aarhus = GeoPoint(56.1629, 10.2039)
                controller.setCenter(aarhus)
                controller.setZoom(15.0)

                // Add a marker for Aarhus
                val marker = Marker(this)
                marker.position = aarhus
                marker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                marker.title = "Aarhus, Denmark"
                overlays.add(marker)
            }
        },
        update = { mapView ->
            // Update map view if needed
        }
    )
}
