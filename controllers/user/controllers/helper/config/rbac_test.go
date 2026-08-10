package config

import (
	"testing"

	userv1 "github.com/labring/sealos/controllers/user/api/v1"
)

func TestGetUserRole_DeveloperIncludesTerminalWrite(t *testing.T) {
	rules := GetUserRole(userv1.DeveloperRoleType)
	for _, rule := range rules {
		if len(rule.APIGroups) == 1 && rule.APIGroups[0] == "terminal.sealos.io" &&
			len(rule.Resources) == 1 && rule.Resources[0] == "terminals" {
			want := map[string]struct{}{
				"create": {},
				"delete": {},
				"get":    {},
				"list":   {},
				"patch":  {},
				"update": {},
				"watch":  {},
			}
			for _, verb := range rule.Verbs {
				delete(want, verb)
			}
			if len(want) != 0 {
				t.Fatalf("developer terminal rule is missing verbs: %v", want)
			}
			return
		}
	}
	t.Fatal("developer role is missing terminal.sealos.io/terminals rule")
}
