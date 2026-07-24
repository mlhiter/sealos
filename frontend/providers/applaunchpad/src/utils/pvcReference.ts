export const PVC_REFERENCE_SOURCE_LABEL = 'storage.sealos.io/pvc-reference-source';
export const PVC_REFERENCE_SOURCE_TYPE_LABEL = 'storage.sealos.io/ref-source';
export const PVC_REFERENCE_NAME_ANNOTATION = 'storage.sealos.io/ref-name';
export const PVC_REFERENCES_ANNOTATION = 'storage.sealos.io/pvc-references';

const PVC_REFERENCE_LABEL_KEYS = [PVC_REFERENCE_SOURCE_LABEL, PVC_REFERENCE_SOURCE_TYPE_LABEL];
const PVC_REFERENCE_ANNOTATION_KEYS = [PVC_REFERENCE_NAME_ANNOTATION, PVC_REFERENCES_ANNOTATION];

type PvcReferenceVolume = {
  name?: string;
  persistentVolumeClaim?: {
    claimName?: string;
  };
};

type PvcReferenceVolumeMount = {
  name?: string;
  mountPath?: string;
};

export const buildMountedPvcReferences = (
  volumes?: PvcReferenceVolume[],
  volumeMounts?: PvcReferenceVolumeMount[]
) => {
  const mountPathsByVolumeName = new Map(
    (volumeMounts || [])
      .filter((mount) => mount.name && mount.mountPath)
      .map((mount) => [mount.name!, mount.mountPath!])
  );

  return (volumes || []).flatMap((volume) => {
    const claimName = volume.persistentVolumeClaim?.claimName?.trim();
    if (!claimName) return [];

    const mountPath = volume.name ? mountPathsByVolumeName.get(volume.name) : undefined;

    return [
      {
        name: claimName,
        relation: 'mounted',
        ...(mountPath ? { mountPath } : {})
      }
    ];
  });
};

export const withPvcReferenceMetadata = <T extends Record<string, any>>(
  metadata: T,
  sourceType: string,
  displayName: string,
  volumes?: PvcReferenceVolume[],
  volumeMounts?: PvcReferenceVolumeMount[]
): T => ({
  ...metadata,
  labels: {
    ...(metadata.labels || {}),
    [PVC_REFERENCE_SOURCE_LABEL]: 'true',
    [PVC_REFERENCE_SOURCE_TYPE_LABEL]: sourceType
  },
  annotations: {
    ...(metadata.annotations || {}),
    [PVC_REFERENCE_NAME_ANNOTATION]: displayName,
    [PVC_REFERENCES_ANNOTATION]: JSON.stringify(buildMountedPvcReferences(volumes, volumeMounts))
  }
});

const copySelectedMetadataKeys = (
  target: Record<string, any>,
  source: Record<string, any>,
  field: 'labels' | 'annotations',
  keys: string[]
) => {
  const sourceValues = source.metadata?.[field];
  if (!sourceValues || typeof sourceValues !== 'object') return;

  keys.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(sourceValues, key)) return;
    if (!target.metadata) target.metadata = {};
    if (!target.metadata[field]) target.metadata[field] = {};
    target.metadata[field][key] = sourceValues[key];
  });
};

export const copyPvcReferenceMetadata = (
  target: Record<string, any>,
  source: Record<string, any>
) => {
  copySelectedMetadataKeys(target, source, 'labels', PVC_REFERENCE_LABEL_KEYS);
  copySelectedMetadataKeys(target, source, 'annotations', PVC_REFERENCE_ANNOTATION_KEYS);
};
