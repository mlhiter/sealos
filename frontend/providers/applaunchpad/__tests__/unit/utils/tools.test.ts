import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';
import {
  json2ConfigMap,
  json2DeployCr,
  yamlString2Objects
} from '@/utils/deployYaml2Json';
import type { AppEditType, DeployKindsType } from '@/types/app';
import {
  PVC_REFERENCES_ANNOTATION,
  PVC_REFERENCE_NAME_ANNOTATION,
  PVC_REFERENCE_SOURCE_LABEL,
  PVC_REFERENCE_SOURCE_TYPE_LABEL
} from '@/utils/pvcReference';
import { patchYamlList } from '@/utils/tools';

const createWorkload = (kind: 'Deployment' | 'StatefulSet', isPrivate: boolean) => ({
  apiVersion: 'apps/v1',
  kind,
  metadata: {
    name: 'demo'
  },
  spec: {
    ...(kind === 'StatefulSet' ? { serviceName: 'demo' } : {}),
    selector: {
      matchLabels: {
        app: 'demo'
      }
    },
    template: {
      metadata: {
        labels: {
          app: 'demo'
        }
      },
      spec: {
        ...(isPrivate ? { imagePullSecrets: [{ name: 'demo' }] } : {}),
        containers: [
          {
            name: 'demo',
            image: isPrivate ? 'registry.example.com/demo:latest' : 'nginx:latest',
            volumeMounts: []
          }
        ],
        volumes: []
      }
    },
    ...(kind === 'StatefulSet' ? { volumeClaimTemplates: [] } : {})
  }
});

const secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'demo'
  },
  type: 'kubernetes.io/dockerconfigjson',
  data: {
    '.dockerconfigjson': 'credentials'
  }
};

const createApp = (): AppEditType =>
  ({
    appName: 'demo',
    imageName: 'nginx:latest',
    runCMD: '',
    cmdParam: '',
    replicas: 1,
    cpu: 100,
    memory: 128,
    networks: [
      {
        networkName: 'demo-web',
        portName: 'web',
        port: 80,
        protocol: 'TCP',
        appProtocol: 'HTTP',
        openPublicDomain: false,
        publicDomain: 'demo',
        customDomain: '',
        domain: 'cloud.example.com',
        openNodePort: false
      }
    ],
    envs: [],
    hpa: {
      use: false,
      target: 'cpu',
      value: 50,
      minReplicas: 1,
      maxReplicas: 1
    },
    secret: {
      use: false,
      username: '',
      password: '',
      serverAddress: ''
    },
    configMapList: [
      {
        mountPath: '/etc/demo/config.yaml',
        key: 'config-yaml',
        value: 'old-value',
        volumeName: 'demo-config'
      }
    ],
    storeList: [],
    networkStoreList: [],
    labels: {},
    volumes: [],
    volumeMounts: [],
    kind: 'deployment'
  } as AppEditType);

const createYamlLists = (app: AppEditType) => [
  json2DeployCr(app, app.kind),
  json2ConfigMap(app)
];

const createOriginalYamlList = (yamlList: string[]) =>
  yamlList.flatMap((item) => yamlString2Objects(item)) as DeployKindsType[];

describe.each(['Deployment', 'StatefulSet'] as const)(
  'patchYamlList private-to-public %s update',
  (kind) => {
    it('preserves imagePullSecrets deletion for JSON Merge Patch', () => {
      const privateWorkload = createWorkload(kind, true);
      const publicWorkload = createWorkload(kind, false);

      const actions = patchYamlList({
        parsedOldYamlList: [yaml.dump(privateWorkload), yaml.dump(secret)],
        parsedNewYamlList: [yaml.dump(publicWorkload)],
        originalYamlList: [privateWorkload, secret] as DeployKindsType[]
      });

      const workloadPatch = actions.find((item) => item.type === 'patch' && item.kind === kind);

      expect(workloadPatch).toMatchObject({
        type: 'patch',
        kind,
        value: {
          spec: {
            template: {
              spec: {
                imagePullSecrets: null
              }
            }
          }
        }
      });
      expect(actions).toContainEqual({
        type: 'delete',
        kind: 'Secret',
        name: 'demo'
      });
    });

    it('keeps imagePullSecrets for private image updates', () => {
      const currentWorkload = createWorkload(kind, true);
      const updatedWorkload = createWorkload(kind, true);
      updatedWorkload.spec.template.spec.containers[0].image = 'registry.example.com/demo:v2';

      const actions = patchYamlList({
        parsedOldYamlList: [yaml.dump(currentWorkload), yaml.dump(secret)],
        parsedNewYamlList: [yaml.dump(updatedWorkload), yaml.dump(secret)],
        originalYamlList: [currentWorkload, secret] as DeployKindsType[]
      });

      const workloadPatch = actions.find((item) => item.type === 'patch' && item.kind === kind);

      expect(workloadPatch).toMatchObject({
        type: 'patch',
        kind,
        value: {
          spec: {
            template: {
              spec: {
                imagePullSecrets: [{ name: 'demo' }]
              }
            }
          }
        }
      });
      expect(actions).not.toContainEqual({
        type: 'delete',
        kind: 'Secret',
        name: 'demo'
      });
    });
  }
);

describe('patchYamlList restart behavior', () => {
  it('restarts the workload when only ConfigMap data changes', () => {
    const oldApp = createApp();
    const newApp = {
      ...oldApp,
      configMapList: [{ ...oldApp.configMapList[0], value: 'new-value' }]
    };
    const oldYamlList = createYamlLists(oldApp);
    const newYamlList = createYamlLists(newApp);

    const actions = patchYamlList({
      parsedOldYamlList: oldYamlList,
      parsedNewYamlList: newYamlList,
      originalYamlList: createOriginalYamlList(oldYamlList)
    });

    const configMapPatch = actions.find(
      (item) => item.type === 'patch' && item.kind === 'ConfigMap'
    );
    const deploymentPatch = actions.find(
      (item) => item.type === 'patch' && item.kind === 'Deployment'
    );

    expect(configMapPatch).toBeDefined();
    expect(deploymentPatch?.type === 'patch' && deploymentPatch.value).toMatchObject({
      metadata: {
        name: 'demo'
      },
      spec: {
        template: {
          metadata: {
            labels: {
              restartTime: expect.any(String)
            }
          }
        }
      }
    });
  });

  it('does not restart the workload when only StatefulSet replicas change', () => {
    const oldApp = createApp();
    oldApp.kind = 'statefulset';
    oldApp.storeList = [
      {
        name: 'data',
        path: '/data',
        value: 1,
        storageType: 'local'
      }
    ];
    const newApp = { ...oldApp, replicas: 2 };
    const oldYamlList = createYamlLists(oldApp);
    const newYamlList = createYamlLists(newApp);

    const actions = patchYamlList({
      parsedOldYamlList: oldYamlList,
      parsedNewYamlList: newYamlList,
      originalYamlList: createOriginalYamlList(oldYamlList)
    });

    const statefulSetPatch = actions.find(
      (item) => item.type === 'patch' && item.kind === 'StatefulSet'
    );

    expect(statefulSetPatch?.type === 'patch' && statefulSetPatch.value).toBeTruthy();
    expect(
      statefulSetPatch?.type === 'patch' &&
        statefulSetPatch.value.spec?.template?.metadata?.labels?.restartTime
    ).toBeFalsy();
  });
});

describe('patchYamlList PVC reference metadata', () => {
  it('backfills reference metadata onto a legacy workload during an edit', () => {
    const oldApp = createApp();
    oldApp.volumes = [
      {
        name: 'shared-data',
        persistentVolumeClaim: {
          claimName: 'team-data'
        }
      }
    ];
    oldApp.volumeMounts = [
      {
        name: 'shared-data',
        mountPath: '/data'
      }
    ];
    const newApp = { ...oldApp, replicas: 2 };
    const oldYamlList = createYamlLists(oldApp);
    const newYamlList = createYamlLists(newApp);
    const originalYamlList = createOriginalYamlList(oldYamlList);
    const legacyWorkload = originalYamlList.find((item) => item.kind === 'Deployment')!;

    delete legacyWorkload.metadata?.labels?.[PVC_REFERENCE_SOURCE_LABEL];
    delete legacyWorkload.metadata?.labels?.[PVC_REFERENCE_SOURCE_TYPE_LABEL];
    delete legacyWorkload.metadata?.annotations?.[PVC_REFERENCE_NAME_ANNOTATION];
    delete legacyWorkload.metadata?.annotations?.[PVC_REFERENCES_ANNOTATION];

    const actions = patchYamlList({
      parsedOldYamlList: oldYamlList,
      parsedNewYamlList: newYamlList,
      originalYamlList
    });
    const deploymentPatch = actions.find(
      (item) => item.type === 'patch' && item.kind === 'Deployment'
    );

    expect(deploymentPatch?.type === 'patch' && deploymentPatch.value).toMatchObject({
      metadata: {
        labels: {
          [PVC_REFERENCE_SOURCE_LABEL]: 'true',
          [PVC_REFERENCE_SOURCE_TYPE_LABEL]: 'applaunchpad'
        },
        annotations: {
          [PVC_REFERENCE_NAME_ANNOTATION]: 'demo',
          [PVC_REFERENCES_ANNOTATION]: JSON.stringify([
            {
              name: 'team-data',
              relation: 'mounted',
              mountPath: '/data'
            }
          ])
        }
      }
    });
  });

  it('backfills reference metadata when only ConfigMap data changes', () => {
    const oldApp = createApp();
    oldApp.networkStoreList = [
      {
        name: 'shared-data',
        path: '/data'
      }
    ];
    const newApp = {
      ...oldApp,
      configMapList: [{ ...oldApp.configMapList[0], value: 'new-value' }]
    };
    const oldYamlList = createYamlLists(oldApp);
    const newYamlList = createYamlLists(newApp);
    const originalYamlList = createOriginalYamlList(oldYamlList);
    const legacyWorkload = originalYamlList.find((item) => item.kind === 'Deployment')!;

    delete legacyWorkload.metadata?.labels?.[PVC_REFERENCE_SOURCE_LABEL];
    delete legacyWorkload.metadata?.labels?.[PVC_REFERENCE_SOURCE_TYPE_LABEL];
    delete legacyWorkload.metadata?.annotations?.[PVC_REFERENCE_NAME_ANNOTATION];
    delete legacyWorkload.metadata?.annotations?.[PVC_REFERENCES_ANNOTATION];

    const actions = patchYamlList({
      parsedOldYamlList: oldYamlList,
      parsedNewYamlList: newYamlList,
      originalYamlList
    });
    const deploymentPatch = actions.find(
      (item) => item.type === 'patch' && item.kind === 'Deployment'
    );

    expect(deploymentPatch?.type === 'patch' && deploymentPatch.value).toMatchObject({
      metadata: {
        labels: {
          [PVC_REFERENCE_SOURCE_LABEL]: 'true',
          [PVC_REFERENCE_SOURCE_TYPE_LABEL]: 'applaunchpad'
        },
        annotations: {
          [PVC_REFERENCE_NAME_ANNOTATION]: 'demo',
          [PVC_REFERENCES_ANNOTATION]: JSON.stringify([
            {
              name: 'shared-data',
              relation: 'mounted',
              mountPath: '/data'
            }
          ])
        }
      },
      spec: {
        template: {
          metadata: {
            labels: {
              restartTime: expect.any(String)
            }
          }
        }
      }
    });
  });

  it('clears stale references after the last mounted PVC is removed', () => {
    const oldApp = createApp();
    oldApp.networkStoreList = [
      {
        name: 'shared-data',
        path: '/data'
      }
    ];
    const newApp = { ...oldApp, networkStoreList: [] };
    const oldYamlList = createYamlLists(oldApp);
    const newYamlList = createYamlLists(newApp);

    const actions = patchYamlList({
      parsedOldYamlList: oldYamlList,
      parsedNewYamlList: newYamlList,
      originalYamlList: createOriginalYamlList(oldYamlList)
    });
    const deploymentPatch = actions.find(
      (item) => item.type === 'patch' && item.kind === 'Deployment'
    );

    expect(deploymentPatch?.type === 'patch' && deploymentPatch.value).toMatchObject({
      metadata: {
        annotations: {
          [PVC_REFERENCES_ANNOTATION]: '[]'
        }
      }
    });

    const deploymentVolumes =
      deploymentPatch?.type === 'patch'
        ? deploymentPatch.value.spec?.template?.spec?.volumes
        : undefined;

    expect(deploymentVolumes).toBeDefined();
    expect(deploymentVolumes).not.toContainEqual(
      expect.objectContaining({
        name: 'shared-data'
      })
    );
  });
});
