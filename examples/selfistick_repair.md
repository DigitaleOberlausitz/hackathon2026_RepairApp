# Selfistick Reparatur oder Neukauf
> *Last updated: 30.5.2026, 16:36:01*

**You** *(30.5.2026, 13:53:39)*

Mein neuer Selfistick ist gebrochen, lohnt es sich ihn zu reparieren oder muss ich ihn neu kaufen?

---

**ChatGPT** *(30.5.2026, 13:53:40)*

Das hängt davon ab, **wo und wie der Selfiestick gebrochen ist**:

- **Gebrochene Kunststoffteile** (z. B. Griff, Halterung für das Smartphone): Oft mit Sekundenkleber oder 2-Komponenten-Epoxidkleber reparierbar. Die Reparatur hält aber nicht immer dauerhaft.
- **Gebrochene Teleskopstange aus Metall**: Meist schwierig und selten stabil zu reparieren. Hier lohnt sich ein Neukauf oft eher.
- **Defekter Bluetooth-Auslöser oder Kabel**: Kann manchmal günstig repariert werden, wenn nur ein Kabel lose ist oder die Batterie gewechselt werden muss.
- **Kostenaspekt**: Viele Selfiesticks kosten nur 10–30 €. Wenn die Reparatur Material oder viel Zeit erfordert, ist ein Neukauf oft wirtschaftlicher.

Wenn du mir ein **Foto des Schadens** hochlädst, kann ich genauer einschätzen:
- ob eine Reparatur sinnvoll ist,
- welche Methode geeignet wäre,
- und ob die Stabilität danach noch ausreichend für dein Smartphone wäre.

---

**You** *(30.5.2026, 13:58:36)*

Die Teleskopstange aus Metall ist direkt unterhalb der Feststellschraube gebrochen. Könnte man irgendetwas 3D drucken, was man auf die Stange draufstülpen und mit der Schraube verbinden könnte, so dass die Stange wieder stabil zusammenhält?

---

**ChatGPT** *(30.5.2026, 13:58:36)*

Ja, das ist grundsätzlich möglich – und oft sogar die sinnvollste Reparatur für genau diese Art von Bruch.

Wenn die Stange **direkt unterhalb der Feststellschraube** gebrochen ist, wirkt dort allerdings ein recht hohes Biegemoment. Ein einfaches gedrucktes Teil, das nur über die Bruchstelle gestülpt wird, wird wahrscheinlich schnell wieder reißen, besonders wenn das Smartphone ausgefahren ist.

Besser wären folgende Konzepte:

### Variante 1: Gedruckte Klemmhülse (empfohlen)
Eine zweiteilige Hülse, die die Bruchstelle auf beiden Seiten umschließt:

```
========||========
        ^^ Bruch

[==== gedruckte Hülse ====]
```

- zweiteilig (obere und untere Schale)
- mit 2–4 Schrauben verschraubt
- mindestens 40–60 mm Überlappung auf jeder Seite
- idealerweise aus PETG, ASA oder Nylon gedruckt
- innen exakt an den Rohrdurchmesser angepasst

Das funktioniert ähnlich wie eine Rohrreparaturschelle.

### Variante 2: Gedruckte Hülse + Metallkern
Noch stabiler:

```
Rohr -> |====|----|====| <- Rohr
          ^
      Alurohr innen
```

- Ein kurzes Aluminium- oder Messingrohr wird innen eingeschoben.
- Die gedruckte Hülse hält alles zusammen.
- Epoxidkleber fixiert die Teile.

Diese Lösung kann überraschend stabil werden.

### Variante 3: Komplettes Ersatzteil für die Schraubaufnahme
Falls der Bruch unmittelbar an der Stelle sitzt, an der die Feststellschraube greift:

```
[Feststellschraube]
       |
   gedrucktes Teil
       |
   Teleskoprohr
```

Dann könnte man die gesamte Schraubenaufnahme neu konstruieren und drucken. Das ist aber nur sinnvoll, wenn man die Geometrie genau kennt.

### Materialwahl
Für so ein belastetes Teil würde ich:

- **PLA:** eher nicht
- **PETG:** gut
- **ASA/ABS:** besser
- **Nylon (PA):** am besten

verwenden.

### Meine Einschätzung
Wenn der Selfiestick ursprünglich 15–30 € gekostet hat, lohnt sich die Reparatur nur, wenn:
- du einen 3D-Drucker hast oder günstig drucken lassen kannst,
- oder du Spaß am Basteln hast.

Technisch halte ich eine **verschraubte Klemmhülse mit innenliegendem Alurohr** für durchaus erfolgversprechend.

Wenn du ein Foto der Bruchstelle hochlädst (am besten mit einem Lineal daneben), kann ich dir sogar eine konkrete Konstruktion skizzieren oder die Maße für ein druckbares Teil abschätzen.

---

**You** *(30.5.2026, 15:33:12)*

Ich habe keine Ahnung von PLA, PETG, ASA/ABS, Nylon(PA), kann ich mir lokal von jemanden helfen lassen oder gibt es Lösungen von der Stange, die ohne 3D-Druck funktionieren?

---

**ChatGPT** *(30.5.2026, 15:33:13)*

Ja, definitiv. Für einen Selfiestick würde ich sogar zuerst nach **einfachen mechanischen Lösungen ohne 3D-Druck** schauen.

Mögliche Reparaturen von der Stange:

### 1. Schrumpfschlauch + Epoxidkleber
Wenn die Bruchstelle sauber ist und die beiden Teile noch gut ineinander passen:

- 2-Komponenten-Epoxidkleber (z. B. UHU Endfest 300)
- mehrere Lagen Schrumpfschlauch darüber

Das kostet nur wenige Euro. Die Stabilität ist allerdings begrenzt.

### 2. Rohrverbinder aus dem Modellbau
In Modellbaugeschäften oder Baumärkten gibt es:
- Messingrohre
- Aluminiumrohre
- Carbonrohre

Oft findet man ein Rohr, das genau in die Teleskopstange hineinpasst.

Vorgehen:
- kurzes Rohrstück (3–5 cm) als "Schiene" einsetzen
- mit Epoxidkleber verkleben
- eventuell außen zusätzlich mit Kabelbindern oder Schrumpfschlauch sichern

Das ist häufig stabiler als ein gedrucktes Teil.

### 3. Kleine Schlauchschelle
Wenn die Bruchstelle nahe am Ende sitzt:

- Edelstahl-Schlauchschelle
- eventuell dünnes Gummi darunter

Nicht schön, aber funktional.

### 4. Reparatur-Café
In Leipzig gibt es mehrere Reparatur-Cafés. Dort sitzen oft Leute mit:
- 3D-Druckern
- Werkzeug
- Erfahrung mit solchen Improvisationsreparaturen

Die schauen sich das meist kostenlos oder gegen eine kleine Spende an.

### 5. Lokale Makerspaces
Leipzig hat mehrere Makerspaces/FabLabs. Dort findest du Leute, die:
- das Teil vermessen,
- eine Hülse konstruieren,
- sie direkt ausdrucken.

Das kostet oft nur wenige Euro Material.

### Was ich an deiner Stelle tun würde
Wenn der Selfiestick nicht besonders teuer war:

1. Foto machen.
2. Schauen, ob ein kleines Aluminiumrohr als Innenverstärkung passt.
3. Mit Epoxidkleber reparieren.

Das ist meist die stabilste und günstigste Lösung.

Falls du ein Foto hochlädst, kann ich dir sogar sagen, welchen Rohrdurchmesser du ungefähr brauchst und ob eine einfache Baumarkt-Lösung ausreicht oder ob ein 3D-gedrucktes Teil tatsächlich sinnvoll wäre.

---

**You** *(30.5.2026, 16:02:50)*

Wo bekomme ich einen Epoxidkleber her?

---

**ChatGPT** *(30.5.2026, 16:02:54)*

Epoxidkleber bekommst du praktisch überall:

- Baumarkt (OBI, Hornbach, Bauhaus, Toom)
- Conrad
- Modellbau-Läden
- Amazon
- teilweise sogar bei Rossmann oder Müller

Für deinen Selfiestick würde ich eher etwas nehmen, das wirklich für Metall geeignet und belastbar ist:

### Gute Optionen

#### UHU Plus Endfest 300
product["turn0product0","UHU plus endfest 300",{"render_as":"hero","description":"Sehr belastbarer 2-Komponenten-Epoxidkleber für Metallreparaturen und strukturelle Verklebungen."}]

Der wird ausdrücklich für hoch belastete Verbindungen eingesetzt und eignet sich gut für Metall. citeturn0search0turn0search3

#### Pattex Kraft-Mix Extrem
product["turn0product1","Pattex Kraft-Mix Extrem Fest",{"render_as":"block","description":"Einfach anzuwendender 2-Komponenten-Kleber für viele Reparaturen im Haushalt."}]

Gut erhältlich und etwas unkomplizierter für kleine Reparaturen.

#### JB Weld Original
product["turn0product2","JB Weld Original",{"render_as":"block","description":"Metallverstärkter Epoxidkleber, beliebt für Reparaturen an Metallteilen."}]

Wird oft für Metallreparaturen verwendet und ist bekannt für hohe Festigkeit.

| Eigenschaft | entity["turn0product0","UHU plus endfest 300"] | entity["turn0product1","Pattex Kraft-Mix Extrem Fest"] | entity["turn0product2","JB Weld Original"] |
|---|---|---|---|
| Für Metall geeignet | Ja | Ja | Ja |
| Belastbarkeit | Sehr hoch | Hoch | Sehr hoch |
| Für strukturelle Reparaturen | Sehr gut | Gut | Sehr gut |
| Verarbeitungszeit | Relativ lang | Kürzer | Mittel |
| Für Selfiestick-Reparatur | Sehr empfehlenswert | Eher zweite Wahl | Sehr empfehlenswert |

Wichtig: Nur Kleber allein wird bei einer gebrochenen Teleskopstange wahrscheinlich nicht dauerhaft halten. Ich würde zusätzlich ein kleines Aluminium- oder Messingrohr als Innenverstärkung verwenden und dann mit Epoxidkleber verkleben. Dadurch wird die Reparatur um ein Vielfaches stabiler. citeturn0search0turn0search8

explore_more{"selections":[["turn0product0","UHU plus endfest 300"],["turn0product1","Pattex Kraft-Mix Extrem Fest"],["turn0product2","JB Weld Original"],["turn0product23","UHU Plus Endfest"]]}

---

**You** *(30.5.2026, 16:03:49)*

Produkt: Lammcou Go Pro Selfie Stick, 4-Stange Action Kamera Aluminium Selfie-Stange Stab, Ausziehbar bis 73cm, Handheld Einbeinstativ Pole Teleskopstange für Hero 12 11 10 9 8 Insta-360 3 2 Yi X3

---

**ChatGPT** *(30.5.2026, 16:03:52)*

Bei genau diesem Modell würde ich eher **reparieren als neu kaufen**, weil:

- die Stange aus Aluminium besteht,
- der Mechanismus relativ simpel ist,
- und ein Bruch direkt unter der Feststellschraube meistens mit einer Innenverstärkung reparierbar ist. citeturn0search3turn0search4

Das Produkt selbst liegt oft ungefähr im Bereich von 15–20 €. citeturn0search2turn0search6

Für deinen Fall würde ich folgendes kaufen:

### Kleber
product["turn0product1","UHU plus endfest 300",{"render_as":"hero","description":"Sehr belastbarer 2-Komponenten-Epoxidkleber für Metallreparaturen und dauerhaft belastete Verbindungen."}]

Alternativ:

product["turn0product2","JB Weld Original",{"render_as":"block","description":"Metallverstärkter Epoxidkleber, häufig für gebrochene Metallteile und Rohrreparaturen verwendet."}]

### Zusätzlich aus dem Baumarkt
Suche nach:

- Aluminiumrohr
- Messingrohr
- Carbonstab (Modellbauabteilung)

Das Rohr sollte möglichst stramm **in die gebrochene Teleskopstange hineinpassen**.

Idealer Aufbau:

```text
Originalrohr
=====|----|=====
      ^
   Innenrohr
```

- Innenrohr ca. 4–6 cm lang
- auf beiden Seiten mindestens 2 cm im Rohr
- mit Epoxidkleber einkleben

Wenn außen noch Platz ist:

```text
[ Schrumpfschlauch ]
====================
```

Das macht die Reparatur zusätzlich stabil.

### Was ich NICHT machen würde
- Sekundenkleber allein
- Heißkleber
- nur Klebeband
- nur eine Schlauchschelle

An dieser Stelle wirken hohe Kräfte, wenn die Kamera am ausgefahrenen Stick hängt.

### Meine Vermutung
Bei deinem Lammcou-Stick dürfte das Rohr einen Außendurchmesser von ungefähr 12–16 mm haben. Deshalb lohnt sich ein kurzer Besuch bei Hornbach, Bauhaus oder OBI mit dem gebrochenen Teil in der Tasche. Dort kannst du direkt ausprobieren, welches Alu- oder Messingrohr hineinpasst.

Wenn du ein Foto der Bruchstelle hochlädst, kann ich ziemlich genau abschätzen:
- ob ein Innenrohr reicht,
- welchen Durchmesser du wahrscheinlich brauchst,
- und ob die Feststellschraube nach der Reparatur weiterhin funktionieren wird.

---

**You** *(30.5.2026, 16:05:07)*

Die Stange ist innen nicht hohl

---

**ChatGPT** *(30.5.2026, 16:05:07)*

Das ist eine wichtige Information. Wenn die Stange **nicht hohl**, sondern ein massiver Aluminiumstab ist, fällt die beste Reparaturmethode (Innenrohr als Verstärkung) leider weg.

Dann bleiben im Wesentlichen drei Möglichkeiten:

### 1. Außenliegende Hülse
Wenn die Bruchstelle nicht direkt an der Feststellschraube sitzt, könnte man eine Metallhülse oder ein etwas größeres Rohr über beide Bruchstücke schieben und verkleben.

Problem: Bei einem Selfiestick sind die Durchmesser oft so gewählt, dass die Segmente ineinander gleiten. Eine Außenhülse kann dann das Einfahren verhindern.

### 2. Mechanische Verbindung mit Stift
Falls genug Material vorhanden ist:

- In beide Bruchstücke ein kleines Loch bohren.
- Einen Stahlstift oder Nagel einsetzen.
- Mit Epoxidkleber verkleben.

Das ist bei dünnen Stäben allerdings ziemlich fummelig und erfordert einen präzisen Bohrständer.

### 3. 3D-gedruckte Klemmhülse
Jetzt wird der 3D-Druck tatsächlich interessanter:

Eine zweiteilige Hülse könnte die beiden Bruchstücke von außen zusammenklemmen, ähnlich einer Rohrschelle. Die eigentliche Last würde dann nicht mehr nur über die Klebestelle laufen.

---

Mich macht allerdings etwas stutzig:

Die meisten Teleskop-Selfiesticks sind aus mehreren ineinandergeschobenen **Hohlrohren** aufgebaut. Wenn dein Lammcou-Stick bis 73 cm ausziehbar ist, wäre ein komplett massiver Aluminiumstab ungewöhnlich schwer.

Kann es sein, dass:
- die äußerste Stange massiv wirkt,
- oder der Bruch direkt an einem eingepressten Endstück passiert ist?

Ein Foto würde hier viel Klarheit schaffen. Oft stellt sich bei solchen Sticks heraus, dass an der Bruchstelle ein Kunststoff- oder Aluminium-Einsatz sitzt, für den man eine deutlich einfachere Reparatur finden kann.

Falls du kein Foto hochladen möchtest: Wie dick ist die gebrochene Stange ungefähr (z. B. 8 mm, 10 mm, 12 mm) und sieht die Bruchfläche wirklich wie massives Metall aus oder erkennt man eine Rohrwand?

---

**You** *(30.5.2026, 16:08:00)*

Der Bruch ist direkt an einem eingepressten Endstück passiert

---

**ChatGPT** *(30.5.2026, 16:08:01)*

Ah, das erklärt einiges. Dann ist die Situation deutlich günstiger.

Bei vielen günstigen Selfiesticks besteht die Teleskopstange tatsächlich aus einem Rohr, aber an den Enden sind **eingepresste oder eingeklebte Aluminium- bzw. Kunststoffteile** für die Verriegelung verbaut. Wenn der Bruch genau dort passiert ist, ist meist nicht das Rohr selbst das Problem, sondern die Verbindung zwischen Rohr und Endstück.

In diesem Fall würde ich Folgendes versuchen:

1. **Bruchstelle reinigen**
   - Alte Kleberreste entfernen.
   - Mit Schleifpapier (120–240er Körnung) die Klebeflächen leicht anrauen.
   - Mit Isopropanol oder Spiritus entfetten.

2. **Mit Epoxidkleber wieder einsetzen**
   - UHU Plus Endfest 300 oder JB Weld wären dafür gut geeignet.
   - Das Endstück wieder exakt ausrichten.
   - Überschüssigen Kleber entfernen.

3. **Zusätzliche Sicherung**
   - Falls genug Platz ist, die Verbindung außen mit einem schmalen Schrumpfschlauch überziehen.
   - Alternativ dünnen Draht oder Kevlarfaden eng um die Verbindungsstelle wickeln und mit Epoxid tränken. Das wirkt überraschend gut gegen erneutes Ausbrechen.

Wenn das eingepresste Teil noch relativ lang ist (z. B. 1–2 cm im Rohr steckt), hält eine Epoxidverklebung oft erstaunlich gut, weil die Belastung über die gesamte Einstecktiefe übertragen wird und nicht nur über die Bruchfläche.

Deshalb würde ich aktuell **keinen 3D-Druck und keine komplizierte Konstruktion** planen. Für einen 15–20-€-Selfiestick ist die Chance recht hoch, dass eine saubere Epoxidreparatur bereits ausreicht.

Ein Foto der Bruchstelle wäre trotzdem hilfreich. Dann kann ich abschätzen, ob die Reparatur eher eine 80-%-Chance oder eine 20-%-Chance auf dauerhaften Erfolg hat. Insbesondere interessiert mich:
- Ist das Endstück aus Metall oder Kunststoff?
- Wie tief steckt es normalerweise im Rohr?
- Ist das Rohr selbst gerissen oder nur die Pressverbindung herausgebrochen?

---

**You** *(30.5.2026, 16:14:58)*

die Bruchstelle ist ziemlich glatt direkt am Oberstück, ein Foto der Bruchstelle habe ich gerade nicht zur Hand, aber ein Foto der relevanten Stelle.

---

**ChatGPT** *(30.5.2026, 16:14:59)*

Danke, das Bild hilft. Das zeigt die typische Verriegelung eines GoPro-/Actioncam-Selfiesticks: Das obere Segment steckt in einem Gehäuse mit Klemmschraube, die beim Festziehen das Rohr zusammendrückt.

Wenn der Bruch **direkt dort passiert, wo das Rohr aus dem Klemmgehäuse herauskommt**, dann ist das leider eine der ungünstigsten Stellen überhaupt:

```text
[Klemmgehäuse]
     ||
     ||  ← Bruch hier
     ||
=====Rohr=====
```

Dort wirken beim Ausfahren die größten Biegekräfte.

### Wenn die Bruchfläche glatt ist
Das spricht dafür, dass entweder:
- das Rohr aus einer eingeklebten Aufnahme herausgerissen ist oder
- das Aluminium direkt an der Übergangsstelle gebrochen ist.

### Meine Einschätzung

**Wenn das Rohr nur aus einer Aufnahme herausgerutscht ist:**
- Sehr gute Chancen.
- Mit UHU Endfest 300 oder JB Weld reinigen, anrauen, neu einkleben.
- Erfolgswahrscheinlichkeit: hoch.

**Wenn das Aluminiumrohr selbst bündig am Gehäuse abgebrochen ist:**
- Nur Kleben wird wahrscheinlich nicht lange halten.
- Die Klebefläche ist zu klein.
- Bei jedem Hebel auf die Kamera wird die Verbindung wieder belastet.

### Ein Trick, den viele Bastler nutzen

Wenn noch 5–10 mm des Rohres im Gehäuse stecken:

1. Reststück vorsichtig entfernen.
2. Rohr und Gehäuse aufrauen.
3. Epoxidkleber verwenden.
4. Zusätzlich ein kleines Loch quer durch Gehäuse und Rohr bohren.
5. Einen 2–3 mm Stahlstift oder eine Schraube durchstecken.

Dann hält nicht nur der Kleber, sondern auch der Stift die Last.

### Lohnt sich ein 3D-Druck?

Für genau diese Stelle eher nicht.

Der Schwachpunkt wäre dann:
- gedrucktes Teil → Schraube → Bruchstelle → Rohr

Die Kräfte konzentrieren sich weiterhin direkt am Übergang. Eine gedruckte Hülse wäre eher eine Ergänzung als die eigentliche Reparatur.

### Was ich tun würde

Für 5–10 € Material:

- UHU Plus Endfest 300 kaufen.
- Bruchstelle genau anschauen.
- Prüfen, ob das Rohr aus einer Aufnahme herausgekommen ist oder wirklich metallisch gebrochen ist.

Davon hängt praktisch alles ab.

Wenn du später ein Foto der **echten Bruchstelle** (beide Bruchstücke nebeneinander) hochlädst, kann ich ziemlich sicher sagen, ob:
- eine einfache Klebung genügt,
- ein Stift sinnvoll wäre,
- oder der Stick wirtschaftlich tot ist. Im Moment würde ich die Chancen auf eine erfolgreiche Reparatur eher als **50–80 %** einschätzen, falls tatsächlich nur die Verbindung zum Klemmgehäuse versagt hat.

---

**You** *(30.5.2026, 16:21:08)*

Da es das oberste Ende des Sticks ist, könnte man nicht irgendeine Kopf mit einer Kralle daraufsetzen, der dann den Kopf fest justiert?

---

**ChatGPT** *(30.5.2026, 16:21:08)*

Ja, das ist sogar eine interessante Idee, weil du einen großen Vorteil hast: **Es ist das oberste Ende des Sticks.**

Dadurch musst du nicht die volle ursprüngliche Teleskopfunktion und Geometrie wiederherstellen. Du musst nur einen neuen Kamerakopf stabil befestigen.

Im Prinzip könntest du einen Adapter bauen:

```text
GoPro-Halter
      |
      |
  Adapterblock
   /      \
  / Kralle \
 |          |
 ============
   Stange
```

Die "Kralle" könnte sein:

- zweiteilige Schelle (wie eine Fahrradlenkerhalterung)
- Rohrklemme aus Metall
- Schlauchschelle + Adapterplatte
- 3D-gedruckte Klemmung

### Besonders einfach: Fahrrad-Zubehör zweckentfremden

Für Actioncams gibt es viele Halterungen für:
- Fahrradlenker
- Rohre
- Stative

Die klemmen Rohre von etwa 10–35 mm Durchmesser.

Wenn dein oberstes Rohr noch ein paar Zentimeter intakt ist, könntest du:

1. den alten Kopf komplett entfernen,
2. eine kleine Lenkerklemme montieren,
3. darauf einen GoPro-Adapter schrauben.

Das wäre mechanisch oft stabiler als eine Klebung an der Bruchstelle.

### Noch einfacher

Es gibt sogenannte:

- Rohrschellen mit 1/4"-Fotogewinde
- Super-Clamps
- Actioncam-Rohrhalter

Die kosten oft unter 10 €.

Dann wäre die Reparatur:

```text
Rohr
 ||
 ||<-- Schelle
 ||
[GoPro Adapter]
```

und die ursprüngliche Bruchstelle spielt fast keine Rolle mehr.

### Die entscheidende Frage

Wie viel Rohr steht **unterhalb der Bruchstelle** noch heraus?

- 5 mm → schwierig
- 20 mm → machbar
- 30 mm oder mehr → sehr gut

Wenn du später ein Foto der tatsächlichen Bruchstelle machst, würde ich eher in Richtung **Rohrklemme + neuer GoPro-Halter** denken als in Richtung aufwendiger Klebereparatur. Das ist oft robuster und benötigt weder 3D-Druck noch Spezialwerkzeug.

---

**You** *(30.5.2026, 16:29:52)*

Unterhalb der Bruchstelle steht kein Rohr mehr raus, der Adapter soll ja deswegen den Kamerakopf komplett umschließen.

---

**ChatGPT** *(30.5.2026, 16:29:53)*

Jetzt verstehe ich deine Idee besser: Du willst die Bruchstelle gar nicht reparieren, sondern einen **neuen Kopf schaffen, der das verbliebene Oberteil von außen umfasst** und darauf die GoPro-Halterung trägt.

Das ist durchaus machbar.

Wenn der ursprüngliche Kopf weggebrochen ist und nur noch das Rohrende vorhanden ist, könnte man beispielsweise eine Art **Kragenadapter** bauen:

```text
      GoPro-Gabel
          |
    ┌─────┴─────┐
    │ Adapter   │
    │           │
    │  Rohr     │
    │ umschl.   │
    └─┬───────┬─┘
      │       │
      Schrauben
```

Das Problem ist die Kraftübertragung:

- Eine GoPro wiegt zwar wenig.
- Ein 70-cm-Selfiestick erzeugt aber einen ordentlichen Hebel.
- Die Verbindung darf sich nicht verdrehen.

Deshalb würde ich nicht auf eine reine Klemmung setzen, sondern auf eine von drei Lösungen:

### A. Kralle + Epoxidkleber
Der Adapter umfasst das Rohr 30–50 mm weit und wird zusätzlich verklebt.

Das ist wahrscheinlich die einfachste Lösung.

### B. Kralle + Querstift
Noch besser:

- Adapter umschließt das Rohr.
- Durch Adapter und Rohr wird ein 2–3 mm Loch gebohrt.
- Ein Stahlstift oder eine Schraube sichert gegen Verdrehen.

Dann trägt der Stift die Last und nicht nur der Kleber.

### C. Metall statt 3D-Druck
Für diese Stelle würde ich sogar eher Aluminium als Kunststoff bevorzugen.

Ein kleiner Metallblock mit einer Rohrklemmung und GoPro-Gabel wäre nahezu unzerstörbar.

---

Die spannende Frage ist allerdings:

**Was genau ist nach dem Bruch noch vorhanden?**

Ist noch das runde Rohrsegment da und nur der eigentliche GoPro-Kopf fehlt?

Oder ist die Bruchstelle direkt an dem schwarzen Klemmgehäuse auf deinem Bild, sodass jetzt nur noch dieses schwarze Gehäuse vorhanden ist?

Je nachdem würde ich entweder:

- einen Rohradapter konstruieren (wenn Rohr vorhanden ist),
- oder einen Adapter bauen, der direkt das schwarze Klemmgehäuse umfasst (wenn kein Rohr mehr vorhanden ist).

Letzteres wäre tatsächlich ein ziemlich guter Anwendungsfall für einen 3D-Druck: eine maßgeschneiderte zweiteilige Schelle, die sich um das vorhandene Gehäuse legt und oben eine neue GoPro-Aufnahme bereitstellt. Das könnte erstaunlich stabil werden, weil das Gehäuse einen viel größeren Durchmesser als das Rohr hat und dadurch deutlich weniger Hebelkräfte auf den Adapter wirken.

---

**You** *(30.5.2026, 16:35:49)*

Das Rohr ist vorhanden und der GoPro-Kopf ist vorhanden und die Bruchstelle ist genau an zwischen Rohr und GoPro-Kopf.

---

**ChatGPT** *(30.5.2026, 16:35:50)*

Okay, jetzt ist das Bild klar:

```text
GoPro-Kopf
    |
    X  ← Bruchstelle
    |
Rohr
```

Also weder das Rohr noch der Kopf fehlen – nur die Verbindung dazwischen ist gebrochen.

In diesem Fall halte ich deine ursprüngliche Idee für deutlich sinnvoller als alles, was ich vorher vorgeschlagen habe.

### Warum?

Die Bruchstelle liegt genau an der Stelle mit der kleinsten Klebefläche. Wenn du die beiden Teile einfach stumpf wieder zusammenklebst, wirkt die gesamte Last auf diese winzige Fläche:

```text
[Kopf]
  ||
  XX
  ||
[Rohr]
```

Das wird wahrscheinlich irgendwann wieder brechen.

### Besser: Ein "Muffen"-Adapter

Stell dir eine Hülse vor, die sowohl den unteren Teil des GoPro-Kopfes als auch das obere Ende des Rohrs umfasst:

```text
      GoPro-Kopf
          |
      [=====]
      [     ]  ← Hülse/Kralle
      [=====]
          |
          |
         Rohr
```

Die Last wird dann über 3–5 cm Länge verteilt statt über die Bruchfläche.

### Braucht man dafür einen 3D-Drucker?

Nicht unbedingt.

Möglichkeiten:

1. **3D-Druck**
   - Maßgeschneiderte zweiteilige Schelle.
   - Wahrscheinlich die eleganteste Lösung.

2. **Metallrohr**
   - Wenn Kopf und Rohr annähernd denselben Außendurchmesser haben.
   - Kurzes Aluminiumrohr als Außenmuffe.
   - Aufschneiden, aufsetzen, verschrauben oder verkleben.

3. **Epoxid + Wicklung**
   - Kopf und Rohr ausrichten.
   - Mit UHU Endfest verkleben.
   - Anschließend mit Glasfaserband, Kevlarfaden oder sogar kräftigem Nähgarn eng umwickeln.
   - Die Wicklung mit Epoxid tränken.

Das klingt improvisiert, funktioniert aber nach demselben Prinzip wie eine Faserverbund-Reparatur.

### Was ich an deiner Stelle machen würde

Bevor ich einen neuen Stick kaufe:

- Für 8–10 € UHU Plus Endfest 300 besorgen.
- Die Teile verkleben.
- Danach die Verbindung 2–3 cm oberhalb und unterhalb der Bruchstelle mit einem starken Faden umwickeln und den Faden ebenfalls mit Epoxid tränken.

Wenn das sauber gemacht wird, ist die Reparatur oft stärker als die ursprüngliche Klebe-/Pressverbindung des Herstellers.

Falls die Reparatur dann doch nicht hält, wäre der nächste Schritt tatsächlich eine **maßgeschneiderte Klemmhülse aus dem 3D-Drucker**. Dafür würde man aber einmal die Durchmesser von Rohr und Kopf messen müssen. Ich vermute, dass ein lokales Repair-Café oder Makerspace so etwas für wenige Euro drucken könnte.

---
