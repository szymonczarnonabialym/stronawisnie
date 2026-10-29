# Czereśnie Kościan — strona i panel pod jedną domeną

## Lokalny podgląd — poprzedni styl z prawdziwymi zdjęciami

Zachowano dotychczasowy wygląd strony: kolory, typografię, nagłówek na zdjęciu, układ sekcji i zaokrąglone przyciski. Dodano pięć zdjęć właściciela, statyczną galerię miniatur bez powiększania i usunięto zieloną kropkę z nagłówka. W tle strony są trzy czereśnie; zdjęcie owoców zastępuje też powtarzające się kwiaty przy plakietce sezonu. Poprawiono menu dla węższych ekranów i położenie plakietki.

Uruchomienie:

```powershell
node scripts/build.mjs
node scripts/preview.mjs
```

Adres: `http://127.0.0.1:5185/`. Lokalny podgląd pokazuje całą stronę również wtedy, gdy sezon na domenie jest zamknięty; odczytuje publiczną ofertę i nie wymyśla cen ani dostępności. Wysyłanie zamówień na localhostie jest zablokowane. Serwer podglądu nie zmienia danych gospodarstwa ani ustawień sezonu. Na domenie nadal obowiązuje tryb wybrany w panelu właściciela.

Sprawdzono składnię JavaScript, budowanie strony, galerię miniatur, menu mobilne i brak przewijania poziomego przy szerokościach 1280 oraz 390 px.

Strona pozostaje w `stronawisnie`. Prywatny rejestr i baza pozostają w `SAD2026` (Worker `sad2026`). Worker strony serwuje pliki statyczne i przekazuje wyłącznie trasy panelu/API oraz zasoby aplikacji przez Service Binding `SAD`.

- `https://czeresniekoscian.pl/` — publiczna strona.
- `https://czeresniekoscian.pl/panel` — aplikacja z dotychczasowym logowaniem właściciela.
- `GET /api/public/offer` — tylko opublikowany komunikat, widoczne odmiany, ceny i dostępność.
- `/api/farm` i `/api/site-offer` — wymagają zalogowanej sesji.

Zmiana cen w panelu nie wymaga commita ani ponownego wdrożenia. Nie zmienia cen sprzedaży zapisanych w dzienniku. Strona odświeża ofertę co minutę i po powrocie do karty; formularz ponownie sprawdza ofertę przed wysłaniem. Podczas awarii lub przed pierwszą publikacją zamówienia online są wyłączone, a strona wskazuje numer telefonu. Zamówienia nadal korzystają z dotychczasowego Formsubmit — ich odbiór i obsługa nie zostały przeniesione do panelu. Nie wysyłaj rzeczywistego zamówienia w ramach testu.

W panelu jest przełącznik **Strona włączona** oraz **Rok sezonu**. Wyłącz przełącznik i kliknij **Opublikuj na stronie**, aby całą publiczną stronę zastąpić ekranem „Sezon 2026 zakończony — Zapraszamy w przyszłym roku!”. Panel `/panel` działa nadal. Worker zwraca ekran sezonowy bezpośrednio dla stron HTML (także `/praca`), a publiczne API przestaje zwracać ofertę. Ceny i odmiany pozostają w prywatnym zapisie i wracają po ponownym włączeniu. Zwykłe odświeżenie od razu pobiera nowy tryb; już otwarte karty sprawdzają go co minutę i po powrocie do karty. Ekran sezonowy także automatycznie wraca do strony po włączeniu. Brak cache dla ekranu sezonowego i API zapobiega utknięciu w starym trybie.

## Kolejność uruchomienia w Cloudflare

1. Najpierw wdróż zmiany w `SAD2026`, zachowując nazwę Workera `sad2026`, binding `DB` i sekret `SAD_LOGIN_CONFIG`. Komendy: `npm run build:cloudflare` oraz `npx wrangler deploy --config dist/server/wrangler.json`. Nie zmieniaj istniejącej bazy i nie przenoś sekretów do GitHub.
2. W `stronawisnie` wykonaj `node scripts/build.mjs`. Wdróż Worker: `npx wrangler@4.92.0 deploy`. Istniejący Worker strony nazywa się `czeresnie2026`; konfiguracja zawiera Service Binding `SAD → sad2026`. Domena `czeresniekoscian.pl` oraz `www.czeresniekoscian.pl` są już przypięte do tej usługi; wdrożenie aktualizuje ją bez przenoszenia domeny.
3. Na adresie `workers.dev` nowego Workera sprawdź stronę, `/panel`, logowanie dotychczasowym kontem, odczyt istniejących wpisów oraz zakładkę „Oferta na stronie”. Ustaw prawdziwe ceny i statusy, kliknij **Opublikuj na stronie**. Publikacja udostępnia tylko świadomie wypełnioną ofertę; początkowe statusy są „Sezon zakończony”. Do edycji oferty potrzebny jest internet.
4. Wdrożenie istniejącego Workera `czeresnie2026` zachowuje przypięcie domeny. Nie trzeba zmieniać DNS ani przepinać domeny. W razie odtwarzania konfiguracji jej Custom Domains to `czeresniekoscian.pl` i `www.czeresniekoscian.pl`.
5. `www.czeresniekoscian.pl` przypisz do tego samego Workera, jeśli ten adres jest używany. Worker odpowiada przekierowaniem 308 na domenę bez `www`. Przetestuj HTTPS, stronę, `/panel`, wylogowanie i publiczny odczyt bez sesji. Linki SEO, sitemap i powrót po zamówieniu wskazują domenę bez `www`.
6. W Cloudflare podłącz repozytorium `stronawisnie` do buildu Workera: katalog `/`, build `node scripts/build.mjs`, deploy `npx wrangler@4.92.0 deploy`, Node 24. `SAD2026` zachowuje własny pipeline. Nie wdrażaj nowych plików strony jako samego hostingu statycznego: wymagane są Worker i Service Binding.

Repozytoria mogą pozostać osobne. Nie potrzeba CORS, tokena API w przeglądarce ani dostępu GitHub przy każdym zapisie ceny. Cookie panelu pozostaje na tej samej domenie.

## Kontrola i wycofanie

`node scripts/check-gateway.mjs` sprawdza routing, zachowanie cookie i usuwanie podszytych nagłówków tożsamości. `node --check offer.js` sprawdza składnię. Testy izolowanej bazy i autoryzacji są w `SAD2026/scripts/check-site-offer.mjs`.

W razie problemu cofnij przypięcie domeny do zapisanej poprzedniej usługi i poprzednie wdrożenie strony. Cofnięcie samego panelu przy pozostawieniu nowej strony wyłączy zamówienia online, bo brak API oferty jest traktowany jako niedostępność. Dane gospodarstwa i tabela oferty w D1 pozostają zachowane.

Dokumentacja: [Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/), [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), [Static Assets](https://developers.cloudflare.com/workers/static-assets/binding/).
