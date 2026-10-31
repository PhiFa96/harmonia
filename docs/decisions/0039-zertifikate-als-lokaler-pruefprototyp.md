# ADR 0039 – Zertifikate als lokaler Prüfprototyp

Datum: 23.10.2026 · Status: technische Entwurfsentscheidung auf Nutzerauftrag

## Kontext

P3.17 ist integriert. Der Nutzer beauftragt P4.18 als internen Prototyp mit servergeprüfter Auswertung, Muster-PDF und interner Codeprüfung. P4.17, die formale P4-Freigabe und fachlich verbindliche Zertifikatsregeln sind offen. Der offene P4.19-Entwurf verwendet ADR 0038; diese Entscheidung erhält deshalb Nummer 0039.

## Entscheidung

Eine getrennte lokale Web-Werkstatt verwendet den vorhandenen Prüfungskern mit zwei eigenen technischen Testprofilen. Node verwaltet die Frist, erzeugt Aufgaben und bewertet jede Antwort. SQLite hält Sitzungstrennung, Antwortprotokoll, Abschluss und Muster-Code über Neustarts hinweg. Transaktionen und eindeutige aktive Durchgänge verhindern doppelte Abschlüsse. Ein Fingerabdruck bindet die Aufgaben an ihren Entwurfsstand.

Die Werkstatt ist fest auf Loopback beschränkt. Sie ist kein Bestandteil des veröffentlichten App-/Website-Builds. Der öffentliche Katalog und die bestehenden P3.17-Vorlagen bleiben unverändert. Sämtliche PDFs und Prüfergebnisse kennzeichnen den ungültigen technischen Entwurf ausdrücklich. Die gewählte 80-%-Schwelle dient nur zum Prüfen der technischen Verzweigung und entscheidet keine Produktfrage.

Ein zufälliger Code mit 128 Bit identifiziert das Muster. Er ist kein signierter Kompetenznachweis. Die lokale Prüfstelle beantwortet ausschließlich, ob der gespeicherte Muster-Datensatz vorhanden oder widerrufen ist; sie gibt keine Antworten, Identitäten oder fremden Punktwerte aus. Ein Cookie ermöglicht private lokale Wiederaufnahme, ersetzt jedoch keine Authentifizierung für einen späteren öffentlichen Dienst. PDF-Erzeugung und Widerruf bleiben an diese Testidentität gebunden. Die Aufbewahrung ist auf sieben Tage begrenzt.

## Folgen

Der technische Ablauf kann vollständig ohne echte Nutzer, Zahlungen, externe Anbieter oder Veröffentlichung geprüft werden. Die Muster lassen sich in Deutsch und beiden Englischvarianten lesen und mit eingebetteter Figtree-Schrift exportieren. Fach-, Rechts-, Identitäts-, Geräte- und Betriebsabnahmen bleiben offen. Eine spätere produktive Lösung benötigt eigene verbindliche Anforderungen und deren Umsetzung; der lokale Dienst wird nicht durch einen Hostwechsel zur Zertifikatsplattform.

P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt. Umsetzung und Prüfbefehle: [P4.18-Entwurf](../plan/zertifikate-entwurf.md).
