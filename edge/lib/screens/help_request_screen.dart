import 'package:flutter/material.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:location/location.dart';

class HelpRequestScreen extends StatefulWidget {
  const HelpRequestScreen({super.key});

  @override
  State<HelpRequestScreen> createState() => _HelpRequestScreenState();
}

class _HelpRequestScreenState extends State<HelpRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedDisaster;
  String? _requestText;
  XFile? _imageFile;
  LocationData? _location;
  bool _submitting = false;

  final List<String> _disasters = [
    'Flood',
    'Earthquake',
    'Fire',
    'Landslide',
    'Cyclone',
    'Other',
  ];

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _imageFile = pickedFile;
      });
    }
  }

  Future<void> _pickLocation() async {
    final location = Location();
    bool serviceEnabled = await location.serviceEnabled();
    if (!serviceEnabled) {
      serviceEnabled = await location.requestService();
      if (!serviceEnabled) return;
    }
    PermissionStatus permissionGranted = await location.hasPermission();
    if (permissionGranted == PermissionStatus.denied) {
      permissionGranted = await location.requestPermission();
      if (permissionGranted != PermissionStatus.granted) return;
    }
    final loc = await location.getLocation();
    setState(() {
      _location = loc;
    });
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    if (_location == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please add your location.'),
        backgroundColor: Colors.redAccent,
      ));
      return;
    }
    setState(() {
      _submitting = true;
    });
    // TODO: Send help request to backend or save locally
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Help request submitted successfully!'),
          backgroundColor: Colors.green,
        ));
        Navigator.pop(context);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Request Assistance'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Describe the Emergency',
                  style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 24),

                // --- Disaster Type Dropdown ---
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Type of Disaster',
                    prefixIcon: Icon(Icons.category_outlined),
                  ),
                  value: _selectedDisaster,
                  items: _disasters.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
                  onChanged: (v) => setState(() => _selectedDisaster = v),
                  validator: (v) => v == null ? 'Please select a disaster type' : null,
                ),
                const SizedBox(height: 16),

                // --- Request Details Text Field ---
                TextFormField(
                  decoration: const InputDecoration(
                    labelText: 'Additional Details',
                    hintText: 'e.g., "Family trapped on the roof," "Road is blocked," etc.',
                    prefixIcon: Icon(Icons.description_outlined),
                  ),
                  maxLines: 4,
                  onChanged: (v) => _requestText = v,
                  validator: (v) => (v == null || v.isEmpty) ? 'Please provide some details' : null,
                ),
                const SizedBox(height: 24),

                // --- Attachments Section ---
                Text(
                  'Attachments',
                  style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),

                // --- Image Picker UI ---
                _buildImagePicker(theme),
                const SizedBox(height: 16),

                // --- Location Picker UI ---
                _buildLocationPicker(theme),
                const SizedBox(height: 32),

                // --- Submit Button ---
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      // Shape is handled by theme, but we can enforce logic here if needed
                    ),
                    onPressed: _submitting ? null : _submit,
                    child: _submitting
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 3,
                            ),
                          )
                        : const Text('Send Request'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- Helper Widget for Image Picker ---
  Widget _buildImagePicker(ThemeData theme) {
    return _imageFile == null
        ? OutlinedButton.icon(
            icon: const Icon(Icons.add_a_photo_outlined),
            label: const Text('Attach a Photo'),
            onPressed: _pickImage,
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              foregroundColor: theme.colorScheme.primary,
            ),
          )
        : Stack(
            alignment: Alignment.topRight,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12.0),
                child: Image.file(
                  File(_imageFile!.path),
                  width: double.infinity,
                  height: 200,
                  fit: BoxFit.cover,
                ),
              ),
              IconButton(
                icon: const CircleAvatar(
                  backgroundColor: Colors.black54,
                  child: Icon(Icons.close, color: Colors.white, size: 18),
                ),
                onPressed: () => setState(() => _imageFile = null),
              ),
            ],
          );
  }

  // --- Helper Widget for Location Picker ---
  Widget _buildLocationPicker(ThemeData theme) {
    return _location == null
        ? OutlinedButton.icon(
            icon: const Icon(Icons.my_location),
            label: const Text('Pinpoint my Current Location'),
            onPressed: _pickLocation,
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              foregroundColor: theme.colorScheme.primary,
            ),
          )
        : Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12.0),
              border: Border.all(color: Colors.green),
            ),
            child: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.green),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Location captured:\nLat: ${_location!.latitude!.toStringAsFixed(4)}, Lon: ${_location!.longitude!.toStringAsFixed(4)}',
                    style: TextStyle(color: Colors.green.shade800),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close, color: Colors.green.shade800),
                  onPressed: () => setState(() => _location = null),
                )
              ],
            ),
          );
  }
}
