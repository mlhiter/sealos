import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { getImageRegistryAddress, json2DeployCr, json2Secret } from '@/utils/deployYaml2Json';
import type { AppEditType } from '@/types/app';
import { resolveAppImageName } from '@/utils/adapt';

const createAppData = (imageName: string): AppEditType =>
  ({
    appName: 'test-app',
    imageName,
    runCMD: '',
    cmdParam: '',
    replicas: 1,
    cpu: 200,
    memory: 256,
    networks: [],
    envs: [],
    hpa: { use: false, target: 'cpu', value: 50, minReplicas: 1, maxReplicas: 2 },
    secret: { use: true, username: 'user', password: 'password', serverAddress: '' },
    configMapList: [],
    storeList: [],
    labels: {},
    volumes: [],
    volumeMounts: [],
    kind: 'deployment'
  } as AppEditType);

describe('private image registry handling', () => {
  it.each([
    ['hub.example.com/team/app:v1', 'hub.example.com'],
    ['192.168.1.10:5000/team/app:v1', '192.168.1.10:5000'],
    ['team/app:v1', 'docker.io'],
    ['app:v1', 'docker.io']
  ])('resolves %s to %s', (imageName, registry) => {
    expect(getImageRegistryAddress(imageName)).toBe(registry);
  });

  it('uses the image reference as-is and uses its registry for the pull secret', () => {
    const data = createAppData('hub.example.com/team/app:v1');
    const deployment = yaml.load(json2DeployCr(data, 'deployment')) as any;
    const secret = yaml.load(json2Secret(data)) as any;

    expect(deployment.spec.template.spec.containers[0].image).toBe('hub.example.com/team/app:v1');
    expect(
      Object.keys(
        JSON.parse(Buffer.from(secret.data['.dockerconfigjson'], 'base64').toString()).auths
      )
    ).toEqual(['hub.example.com']);
  });

  it('uses docker.io for a short private image reference', () => {
    const data = createAppData('team/app:v1');
    const secret = yaml.load(json2Secret(data)) as any;
    const auths = JSON.parse(
      Buffer.from(secret.data['.dockerconfigjson'], 'base64').toString()
    ).auths;

    expect(auths).toHaveProperty('docker.io');
  });

  it('uses the deployed image when editing an app created with separate registry fields', () => {
    expect(
      resolveAppImageName({
        deployedImage: 'hub.example.com/team/app:v1',
        originImageName: 'team/app:v1',
        usesPrivateRegistry: true
      })
    ).toBe('hub.example.com/team/app:v1');
  });
});
