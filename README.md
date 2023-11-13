HomeAssistant-PV-Power-Flow-Card
(Nach dem Vorbild der Huawei-Fusion-Solar-App)

![grafik](Bilder/Params.PNG)
![grafik](Bilder/Flow.PNG)

Die Karte hat 4 Parameter:
- PV: Leistung der Module (nur positiv, 0-...) in kW
- Batterie-Ladung: Ladung bzw Enladung der Batterie (negativ/positiv, positiv ist Baterie-Ladung, negativ ist Ent-Ladung) in kW
- Batterie-Ladezustand: Ladezustand (0...100) in %
- Meter: Leistung ins bzw aus dem Netz  (negativ/positiv, positiv ist Netz-Einspeisung, negativ ist Netz-Bezug) in kW

Einen visuellen Editor gibt es nicht.


Installation:
- im Verzeichnis "config" von HA neues Verzeichnis "www" anlegen
- Javascript-Datei downloaden und dort (im Verzeichnis www) abspeichern
- in HA Resource hinzufügen:
  - Einstellungen -> Dashboards -> Resourcen (die drei Punkte rechts oben) -> Resource hinzufügen
  - "/local/powerflowcard.js" als Javascript-Modul eintragen
  - ![grafik](Bilder/Resource.PNG)
- Seite neu laden (im Browser)
- die Karte sollte dann in der Liste der installierbaren Karten auftauchen (Dashboard bearbeiten, Karte hinzufügen)
- ![grafik](Bilder/Card.PNG)






