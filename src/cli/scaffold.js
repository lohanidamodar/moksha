/**
 * `moksha capture --scaffold` — the app-side half, printed.
 *
 * Two small Dart files live in the app's repo, not here: a helper that talks
 * the handshake, and the test that walks the app. They are printed rather
 * than written, because where they go and what the app's screens are called
 * is the app author's business.
 */

const HELPER = `// integration_test/moksha_capture.dart
//
// Asks the host to photograph the screen, and waits until it has. Written by
// \`moksha capture --scaffold\`.
import 'dart:io';

import 'package:patrol/patrol.dart';

/// Injected by \`moksha capture\`. Empty when the test runs any other way, so
/// the same test is still a normal Patrol test outside a capture run.
const _captureUrl = String.fromEnvironment('MOKSHA_CAPTURE_URL');

/// Settle the frame, then block until the host has taken the shot.
///
/// The wait is the point: without it the test navigates on while the host is
/// still photographing, and you get the next screen under the last name.
Future<void> captureScene(PatrolIntegrationTester \$, String scene) async {
  await \$.pumpAndSettle();
  if (_captureUrl.isEmpty) return;

  final client = HttpClient();
  try {
    final request = await client.getUrl(
      Uri.parse('\$_captureUrl/capture?scene=\$scene'),
    );
    final response = await request.close();
    final body = await response
        .transform(const SystemEncoding().decoder)
        .join();
    if (response.statusCode != 200) {
      throw StateError('moksha could not capture "\$scene": \$body');
    }
  } finally {
    client.close();
  }
}
`;

const TEST = `// integration_test/store_screenshots.dart
//
// One scene per screenshot the listing needs, in store order. Name them the
// same as \`capture.scenes\` in moksha.json.
import 'package:patrol/patrol.dart';

import 'package:your_app/main.dart' as app;

import 'moksha_capture.dart';

void main() {
  patrolTest('store screenshots', (\$) async {
    await \$.pumpWidgetAndSettle(const app.MyApp());

    // Patrol drives the native layer too, so a permission sheet sitting on
    // top of the screen you are photographing can be dismissed first.
    // await \$.native.grantPermissionWhenInUse();

    await captureScene(\$, 'home');

    await \$(#searchTab).tap();
    await captureScene(\$, 'search');

    await \$('Settings').tap();
    await captureScene(\$, 'settings');
  });
}
`;

const PROJECT = `  "capture": {
    "test": "integration_test/store_screenshots.dart",
    "scenes": ["home", "search", "settings"],
    "dir": "captures"
  }`;

export function scaffold() {
	console.log(`
Capture has two halves. Moksha drives the run and takes the pictures; the app
repo says which screens to visit.

1. Add patrol to the app:

     flutter pub add --dev patrol
     dart pub global activate patrol_cli
     patrol doctor

2. Write these two files in the app's integration_test/ directory:

${HELPER}
${TEST}
3. Point the project at the test, in moksha/moksha.json:

${PROJECT}

4. Run it:

     moksha capture --platform android

Each scene lands in captures/<platform>/<scene>.png at the device's native
resolution. Reference them from your assets:

  { "id": "home", "assetType": "android-phone-screenshot",
    "images": { "screenshot": "captures/android/home.png" } }

A raw capture is not an uploadable asset — a 1080x2400 phone screen is 2.22:1
and Play refuses it. Framing it with \`moksha render\` is what makes it one.
`);
	return 0;
}
