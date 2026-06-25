from app.routers import analysis, jobs, user


class App:
    def __init__(self):
        self.routes = []
        self._register_routes()

    def _register_routes(self):
        self.routes.extend([
            ('GET', '/health', self.health_check),
            ('POST', '/api/resume/analyze', analysis.analyze_resume),
            ('POST', '/api/job-match', jobs.job_match),
            ('GET', '/api/user/profile', user.get_profile),
        ])

    def health_check(self):
        return {'status': 'ok', 'service': 'careerpilot-ai'}


app = App()
