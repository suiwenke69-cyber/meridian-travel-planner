'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { Hotel, Place, PlaceCandidate, UserSavedPlace } from '@/lib/types';
import type { DoCategory } from '@/lib/store/ui-store';
import { getDestinationBundle, isLocatable } from '@/lib/data';
import { countMarkersByLayer, buildMapMarkers } from '@/lib/map-markers';
import { useTripStore } from '@/lib/store/trip-store';
import { useUiStore } from '@/lib/store/ui-store';
import { useImportUiStore } from '@/lib/store/import-ui';
import { useResearchStore } from '@/lib/research/store';
import { isRefInTrip } from '@/lib/trip';
import { useDayLegs } from '@/lib/transport/use-day-legs';
import { matchesCategory } from './panels/DoPanel';
import MapCanvas from '../map/MapCanvas';
import MarkersLayer from '../map/MarkersLayer';
import RouteLayer from '../map/RouteLayer';
import AreaLayer from '../map/AreaLayer';
import MapFocusController from '../map/MapFocusController';
import { useIsDesktop } from '@/lib/hooks';
import { useT } from '@/lib/i18n/use-t';

/**
 * The destination map — the dominant surface of every tab.
 *
 * The map shows ONE thing at a time, chosen by the tab and the filters:
 *   explore → areas only, with names and taglines
 *   stay    → loyalty hotels
 *   do      → places in the selected category only
 *   plan    → the active day's route
 *
 * The previous build drew every category at once, which is the main reason it
 * read as marker overload.
 */
export default function DestinationMapView({
  destinationId,
  showAreas,
}: {
  destinationId: string;
  showAreas: boolean;
}) {
  const bundle = getDestinationBundle(destinationId);
  const isDesktop = useIsDesktop();
  const t = useT();

  const tab = useUiStore((s) => s.panelTab);
  const locale = useUiStore((s) => s.locale);
  const doCategory = useUiStore((s) => s.doCategory);
  const exploreScope = useUiStore((s) => s.exploreScope);
  const focusedAreaId = useUiStore((s) => s.selectedAreaId);
  const selectedEntityId = useUiStore((s) => s.selectedEntityId);
  const hoveredEntityId = useUiStore((s) => s.hoveredEntityId);
  const selectedItemId = useUiStore((s) => s.selectedItemId);
  const hoveredItemId = useUiStore((s) => s.hoveredItemId);
  const selectedDayId = useUiStore((s) => s.selectedDayId);
  const showRoute = useUiStore((s) => s.showRoute);

  /*
   * The import flow and 我的收藏 both narrow the DO marker set.
   *
   * They live in a separate store because they are a mode, not a preference —
   * and because an import review must not survive a reload. While a review is
   * open the map draws THAT import's candidates and nothing else: the promise is
   * "paste a guide and its places appear on my map", and a map still covered in
   * every restaurant on the island would hide the answer.
   */
  const previewImportId = useImportUiStore((s) => s.previewImportId);
  const placeScope = useImportUiStore((s) => s.placeScope);
  const picking = useImportUiStore((s) => s.picking);
  const pickedLocation = useImportUiStore((s) => s.pickedLocation);
  const setPickedLocation = useImportUiStore((s) => s.setPickedLocation);
  const savedPlaces = useResearchStore((s) => s.savedPlaces);
  const candidates = useResearchStore((s) => s.candidates);
  const selectEntity = useUiStore((s) => s.selectEntity);
  const selectArea = useUiStore((s) => s.selectArea);
  const selectItem = useUiStore((s) => s.selectItem);
  const selectDay = useUiStore((s) => s.selectDay);
  const setHoveredEntity = useUiStore((s) => s.setHoveredEntity);
  const resetSelection = useUiStore((s) => s.resetSelection);
  const requestFit = useUiStore((s) => s.requestFit);

  const trip = useTripStore((s) => {
    const active = s.trips.find((t) => t.id === s.activeTripId);
    if (active && active.destinationId === destinationId) return active;
    return (
      s.trips.filter((t) => t.destinationId === destinationId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
      null
    );
  });

  const activeDay = useMemo(() => {
    if (!trip) return null;
    return trip.days.find((d) => d.id === selectedDayId) ?? trip.days[0] ?? null;
  }, [trip, selectedDayId]);

  // Reuse the same routing the itinerary panel uses, so the map line and the
  // leg rows can never disagree.
  const { legs } = useDayLegs(tab === 'plan' ? activeDay : null);

  const areaNameById = useMemo(
    () => new Map((bundle?.areas ?? []).map((a) => [a.id, locale === 'zh-CN' && a.nameZh ? a.nameZh : a.name])),
    [bundle],
  );

  /*
   * An import review outranks the tab.
   *
   * The traveller opens the flow from whichever step they were on — usually
   * EXPLORE or PLAN — and the promise is that their places appear on the map
   * right then. Scoping the preview to DO meant the review opened on a map with
   * nothing on it, which is the one moment the feature has to deliver.
   */
  const importPreview = useMemo(() => {
    if (!previewImportId || !bundle) return null;
    return doScope(bundle.places, bundle.hotels, {
      previewImportId,
      candidates,
      placeScope,
      savedPlaces,
      focusedAreaId: null,
      doCategory,
      destinationId,
    });
  }, [previewImportId, bundle, candidates, placeScope, savedPlaces, doCategory, destinationId]);

  const markers = useMemo(() => {
    if (!bundle) return [];

    if (importPreview) {
      const layers = emptyLayers();
      for (const place of importPreview.places) layers[place.markerLayer] = true;
      for (const hotel of importPreview.hotels) layers[hotel.hotelGroup] = true;
      const built = buildMapMarkers({
        hotels: importPreview.hotels,
        places: importPreview.places,
        airports: [],
        trip: null,
        activeDay: null,
        visibleLayers: layers,
        filters: defaultFilters(),
        selectedEntityId,
        selectedItemId,
        hoveredItemId: hoveredEntityId,
        areaNameById,
      }).markers;
      /*
       * A place the traveller is placing gets a marker the moment they click.
       *
       * Without it they click the map and see nothing change, which reads as the
       * click not registering — and then they click again somewhere else.
       */
      if (pickedLocation) {
        built.push({
          id: '__picked__',
          lat: pickedLocation.lat,
          lng: pickedLocation.lng,
          layer: 'activity',
          label: t('import.pickedMarker'),
          noTooltip: false,
          selected: true,
          zIndexOffset: 1000,
        });
      }
      return built;
    }

    if (tab === 'explore') {
      // Areas carry the meaning here; individual markers would compete with them.
      return [];
    }

    if (tab === 'stay') {
      const visibleLayers = { ...emptyLayers(), marriott: true, hilton: true };
      return buildMapMarkers({
        hotels: bundle.hotels,
        places: [],
        airports: [],
        trip: null,
        activeDay: null,
        visibleLayers,
        filters: defaultFilters(selectedHotelGroup(hoveredEntityId, selectedEntityId, bundle.hotels)),
        selectedEntityId,
        selectedItemId,
        hoveredItemId: hoveredEntityId,
        areaNameById,
      }).markers;
    }

    if (tab === 'do') {
      const scoped = doScope(bundle.places, bundle.hotels, {
        previewImportId,
        candidates,
        placeScope,
        savedPlaces,
        focusedAreaId,
        doCategory,
        destinationId,
      });
      const layers = emptyLayers();
      for (const place of scoped.places) layers[place.markerLayer] = true;
      for (const hotel of scoped.hotels) layers[hotel.hotelGroup] = true;
      return buildMapMarkers({
        hotels: scoped.hotels,
        places: scoped.places,
        airports: [],
        trip: null,
        activeDay: null,
        visibleLayers: layers,
        filters: defaultFilters(),
        selectedEntityId,
        selectedItemId,
        hoveredItemId: hoveredEntityId,
        areaNameById,
      }).markers;
    }

    // plan
    if (!trip || !activeDay) return [];
    return buildMapMarkers({
      hotels: bundle.hotels,
      places: bundle.places,
      airports: bundle.airports,
      trip,
      activeDay,
      visibleLayers: emptyLayers(),
      filters: defaultFilters(),
      selectedEntityId,
      selectedItemId,
      hoveredItemId: hoveredItemId ?? hoveredEntityId,
      areaNameById,
    }).markers;
  }, [
    bundle,
    tab,
    doCategory,
    trip,
    activeDay,
    selectedEntityId,
    selectedItemId,
    hoveredEntityId,
    hoveredItemId,
    areaNameById,
    importPreview,
    previewImportId,
    candidates,
    placeScope,
    savedPlaces,
    focusedAreaId,
    destinationId,
    pickedLocation,
    t,
  ]);

  const routePoints = useMemo(() => {
    if (tab !== 'plan' || !activeDay) return [];
    const geometryFromLegs = legs.flatMap((leg, index) =>
      index === 0 && leg.geometry ? leg.geometry : leg.geometry ? leg.geometry.slice(1) : [],
    );
    if (geometryFromLegs.length >= 2) {
      return geometryFromLegs.map((point, index) => ({
        id: `route-${index}`,
        lat: point.lat,
        lng: point.lng,
        layer: 'activity' as const,
      }));
    }
    // No measured geometry: fall back to the straight corridor between stops,
    // drawn dashed so it cannot be mistaken for a road.
    return activeDay.items.map((item, index) => ({
      id: `stop-${index}`,
      lat: item.lat,
      lng: item.lng,
      layer: 'activity' as const,
    }));
  }, [tab, activeDay, legs]);

  const routeIsEstimate = !legs.some((leg) => leg.geometry);

  const activeAreaIds = useMemo(
    () => (activeDay && tab === 'plan' ? Array.from(new Set(activeDay.items.map((i) => i.areaId).filter(Boolean) as string[])) : []),
    [activeDay, tab],
  );

  const focusedArea = bundle?.areas.find((a) => a.id === focusedAreaId);

  /*
   * Which travel zones the map is allowed to draw.
   *
   * EXPLORE lists one scope at a time ("Stay" or "Day trips"), so the map draws
   * one scope at a time. Outside EXPLORE the zones are only background context,
   * so only the areas the current day actually touches get a zone at all.
   */
  const zoneIds = useMemo(() => {
    if (!bundle) return [];
    // Areas are context; during a review the candidates are the content.
    if (previewImportId) return [];
    if (tab === 'explore') {
      return bundle.areas.filter((a) => a.isStayBase === (exploreScope === 'stay')).map((a) => a.id);
    }
    if (tab === 'plan') return activeAreaIds;
    // STAY and DO: the stay bases are the only geography worth naming behind a
    // list of hotels or places. Excursion zones would just add rings.
    return bundle.areas.filter((a) => a.isStayBase).map((a) => a.id);
  }, [bundle, tab, exploreScope, activeAreaIds, previewImportId]);

  const requestFitRef = useRef(requestFit);
  requestFitRef.current = requestFit;

  /*
   * Each tab frames the map for its own question.
   *
   * Without this, switching to STAY left the camera at whole-island scale where
   * every hotel collapses into a cluster and neither loyalty programme is
   * distinguishable — the map looked busy and said nothing. The camera is part
   * of the navigation.
   */
  useEffect(() => {
    if (!bundle) return;
    const fit = requestFitRef.current;

    if (previewImportId) return;

    if (tab === 'explore') {
      if (focusedArea) {
        fit([{ lat: focusedArea.coordinates.lat, lng: focusedArea.coordinates.lng }], 11.4);
      } else {
        const map = (window as unknown as { __mmMap?: { fitBounds: (b: unknown, o?: unknown) => void } }).__mmMap;
        if (map && bundle.destination.mapBounds) {
          map.fitBounds(
            [
              [bundle.destination.mapBounds[0][1], bundle.destination.mapBounds[0][0]],
              [bundle.destination.mapBounds[1][1], bundle.destination.mapBounds[1][0]],
            ],
            { padding: 60, duration: 700 },
          );
        }
      }
      return;
    }

    if (tab === 'stay') {
      const hotels = bundle.hotels.filter((h) => !focusedArea || h.areaId === focusedArea.id);
      if (hotels.length === 0) return;
      fit(hotels.map((h) => h.coordinates), 11.8);
      return;
    }

    if (tab === 'do') {
      const scoped = doScope(bundle.places, bundle.hotels, {
        previewImportId,
        candidates,
        placeScope,
        savedPlaces,
        focusedAreaId: focusedArea?.id ?? null,
        doCategory,
        destinationId,
      });
      const points = [...scoped.places.map((p) => p.coordinates), ...scoped.hotels.map((h) => h.coordinates)];
      if (points.length === 0) return;
      fit(points, points.length === 1 ? 12.5 : 11.2);
      return;
    }

    /*
     * PLAN frames the day you are looking at. Without this the camera stayed
     * wherever the previous tab left it, so switching to your itinerary could
     * show you an empty stretch of sea while your three stops sat off-screen.
     */
    if (tab === 'plan') {
      if (!activeDay || activeDay.items.length === 0) return;
      fit(
        activeDay.items.map((item) => ({ lat: item.lat, lng: item.lng })),
        activeDay.items.length === 1 ? 12.5 : 11.5,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tab,
    doCategory,
    focusedArea?.id,
    bundle,
    activeDay?.id,
    activeDay?.items.length,
    previewImportId,
    candidates,
    placeScope,
    savedPlaces,
    destinationId,
  ]);


  if (!bundle) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">Destination data unavailable.</div>;
  }

  const { destination } = bundle;

  return (
    <MapCanvas
      center={destination.mapView.center}
      zoom={destination.mapView.zoom}
      bounds={destination.mapBounds}
      fitBounds={Boolean(destination.mapBounds)}
      fitKey={`dest-${destination.id}`}
      minZoom={8}
      maxZoom={18}
      fitPadding={[60, 60]}
      fitPaddingBottom={isDesktop ? 0 : 420}
      ariaLabel={`Planning map of ${destination.name}`}
      zoomControlPosition="bottom-right"
      onBackgroundClick={resetSelection}
      /*
       * Picking a spot for a place the dataset does not hold. Nothing else in
       * the product consumes a raw coordinate click, so this is a no-op unless
       * the traveller is actually placing something.
       */
      onMapClick={picking ? (point) => setPickedLocation(point) : undefined}
    >
      <AreaLayer
        areas={bundle.areas}
        hotels={bundle.hotels}
        places={bundle.places}
        visible={showAreas}
        zoneIds={zoneIds}
        selectedAreaId={focusedAreaId}
        activeAreaIds={activeAreaIds}
        // Areas are the primary content of EXPLORE and background context elsewhere.
        opacity={tab === 'explore' ? 'prominent' : 'quiet'}
        onSelectArea={(areaId) => {
          if (tab === 'explore') {
            selectArea(areaId === focusedAreaId ? null : areaId);
          } else {
            selectArea(areaId);
          }
        }}
      />

      {tab === 'plan' && showRoute && routePoints.length >= 2 && (
        <RouteLayer points={routePoints} dashed={routeIsEstimate} />
      )}

      <MarkersLayer
        markers={markers}
        cluster
        clusterMaxZoom={tab === 'stay' ? 11 : tab === 'do' ? 11.5 : 12}
        onSelect={(id) => {
          selectEntity(id);
          setHoveredEntity(null);
          if (trip) {
            const found = isRefInTrip(trip, id);
            if (found) {
              selectDay(found.dayId);
              selectItem(found.itemId);
            }
          }
        }}
        onHover={(id) => {
          setHoveredEntity(id);
          const leg = legs.find((l) => l.id === id);
          useUiStore.getState().selectLeg(leg ? leg.id : null);
        }}
      />

      <MapFocusController />
    </MapCanvas>
  );
}

/**
 * What the DO tab is allowed to draw.
 *
 * Three modes, in priority order: an import under review, 我的收藏, and the
 * ordinary category browse. They are exclusive rather than additive because
 * "the places from this guide" and "every restaurant in Canggu" on the same map
 * would answer neither question.
 *
 * Hotels are included because a guide names them and because 我的收藏 has a 酒店
 * filter; the category browse still shows none, since STAY owns that.
 */
function doScope(
  places: Place[],
  hotels: Hotel[],
  options: {
    previewImportId: string | null;
    candidates: PlaceCandidate[];
    placeScope: 'all' | 'saved';
    savedPlaces: UserSavedPlace[];
    focusedAreaId: string | null;
    doCategory: DoCategory;
    destinationId: string;
  },
): { places: Place[]; hotels: Hotel[] } {
  const { previewImportId, candidates, placeScope, savedPlaces, focusedAreaId, doCategory, destinationId } = options;

  if (previewImportId) {
    const ids = new Set(
      candidates
        .filter((candidate) => candidate.importId === previewImportId && candidate.matchedPlaceId)
        .map((candidate) => candidate.matchedPlaceId as string),
    );
    return {
      places: places.filter((place) => ids.has(place.id) && isLocatable(place)),
      hotels: hotels.filter((hotel) => ids.has(hotel.id)),
    };
  }

  if (placeScope === 'saved') {
    const ids = new Set(savedPlaces.filter((entry) => entry.destinationId === destinationId).map((entry) => entry.placeId));
    return {
      places: places.filter((place) => ids.has(place.id) && isLocatable(place)),
      hotels: hotels.filter((hotel) => ids.has(hotel.id)),
    };
  }

  return {
    places: places.filter(
      (place) => (!focusedAreaId || place.areaId === focusedAreaId) && matchesCategory(place, doCategory) && isLocatable(place),
    ),
    hotels: [],
  };
}

function emptyLayers() {
  return {
    marriott: false,
    hilton: false,
    activity: false,
    nature: false,
    beach: false,
    food: false,
    nightlife: false,
    airport: false,
    transport: false,
  };
}

function defaultFilters(overrides = {}) {
  return { query: '', hotelGroups: [], priceTiers: [], hotelStyles: [], placeCategories: [], ...overrides };
}

/** Highlighting a hotel card should not silently filter the map, so this is a no-op filter. */
function selectedHotelGroup(_hovered: string | null, _selected: string | null, _hotels: unknown) {
  return {};
}

export { countMarkersByLayer };
