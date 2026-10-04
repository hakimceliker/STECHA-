import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(const StechAiApp());
}

class StechAiApp extends StatelessWidget {
  const StechAiApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Stech AI',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;

  final List<Widget> _pages = [
    const MapScreen(),
    const ReservationScreen(),
    const PreOrderScreen(),
    const PaymentScreen(),
    const SOSScreen(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.map),
            label: 'Harita',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.restaurant),
            label: 'Rezervasyon',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_bag),
            label: 'Sipariş',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.payment),
            label: 'Ödeme',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.emergency),
            label: 'SOS',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.blue,
        unselectedItemColor: Colors.grey,
        onTap: _onItemTapped,
      ),
    );
  }
}

class MapScreen extends StatelessWidget {
  const MapScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.map, size: 64, color: Colors.blue),
          SizedBox(height: 16),
          Text('Harita - Yakın İşletmeleri Gör'),
        ],
      ),
    );
  }
}

class ReservationScreen extends StatelessWidget {
  const ReservationScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.restaurant, size: 64, color: Colors.blue),
          SizedBox(height: 16),
          Text('Masa Rezervasyonu'),
        ],
      ),
    );
  }
}

class PreOrderScreen extends StatelessWidget {
  const PreOrderScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.shopping_bag, size: 64, color: Colors.blue),
          SizedBox(height: 16),
          Text('Ön Sipariş'),
        ],
      ),
    );
  }
}

class PaymentScreen extends StatelessWidget {
  const PaymentScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.payment, size: 64, color: Colors.blue),
          SizedBox(height: 16),
          Text('Ödeme'),
        ],
      ),
    );
  }
}

class SOSScreen extends StatelessWidget {
  const SOSScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.emergency, size: 64, color: Colors.red),
          SizedBox(height: 16),
          Text('Acil Durum (SOS)'),
        ],
      ),
    );
  }
}
