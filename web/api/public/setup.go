package public

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/komari-monitor/komari/database/accounts"
)

// SetupRequest Web 端初始化设置请求体
type SetupRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Setup 处理首次部署时的 Web 端初始化设置。
// 仅在数据库中无任何用户时可用，创建第一个管理员账号。
// 一旦有用户存在，此接口自动失效，防止被滥用。
func Setup(c *gin.Context) {
	// 安全检查：只有在没有任何用户时才允许初始化
	if accounts.HasAnyUser() {
		c.JSON(http.StatusForbidden, gin.H{
			"status":  "error",
			"message": "系统已初始化，无法重复设置",
		})
		return
	}

	var req SetupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "请提供用户名和密码",
		})
		return
	}

	// 基本校验
	username := strings.TrimSpace(req.Username)
	password := strings.TrimSpace(req.Password)
	if len(username) < 3 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "用户名至少 3 个字符",
		})
		return
	}
	if len(password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "密码至少 6 个字符",
		})
		return
	}

	// 创建管理员账号
	_, err := accounts.CreateAccount(username, password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "创建管理员账号失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "管理员账号创建成功，请使用新账号登录",
	})
}
