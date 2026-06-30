import { Tabs } from 'expo-router';
import { TabBarIcon } from '@/components/TabBarIcon';
import { colors, fontFamilyForWeight } from '@/theme';

export default function FamilyTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted3,
        tabBarStyle: { height: 80, backgroundColor: colors.white, borderTopColor: colors.cardBorder, paddingTop: 8 },
        tabBarLabelStyle: { fontFamily: fontFamilyForWeight(600), fontSize: 10 },
      }}
    >
      <Tabs.Screen name="inicio" options={{ title: 'Inicio', tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} /> }} />
      <Tabs.Screen name="actividad" options={{ title: 'Actividad', tabBarIcon: ({ focused }) => <TabBarIcon name="pulse" focused={focused} /> }} />
      <Tabs.Screen name="mensajes" options={{ title: 'Mensajes', tabBarIcon: ({ focused }) => <TabBarIcon name="message" focused={focused} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ focused }) => <TabBarIcon name="user" focused={focused} /> }} />
    </Tabs>
  );
}
